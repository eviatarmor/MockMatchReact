import { useCallback, useEffect, useRef, useState } from "react"
import {
  setCollabDocument,
  useCollabYDoc,
  type CollabYSnapshot,
} from "@mockmatch/collab"
import type { SpreadsheetDocument } from "@mockmatch/spreadsheet"
import { useCollabRoom } from "@/features/collab/hooks/use-collab-room"
import type { CollabPermissions } from "@/features/collab/types"

type Args = {
  readonly workbookId: string | null
  readonly shareToken?: string | null
  /** Called when remote peers change the workbook. */
  readonly onRemoteDocument: (doc: SpreadsheetDocument) => void
  /** Current local document for outbound CRDT mirror. */
  readonly localDocument: SpreadsheetDocument | null
  readonly canEdit: boolean
}

/**
 * Live collab for spreadsheet workbooks (`document_kind: spreadsheet`).
 * Mirrors local workbook JSON into the shared Y.Doc and applies remote snaps.
 */
export function useCollabSpreadsheetSession({
  workbookId,
  shareToken,
  onRemoteDocument,
  localDocument,
  canEdit,
}: Args) {
  const skipOutbound = useRef(false)
  const sendYUpdateRef = useRef<(u: string) => void>(() => {})

  const liveRef = useRef(false)

  const onRemoteMaterialize = useCallback(
    (snap: CollabYSnapshot) => {
      // Only merge peer CRDT materializations while the room is live.
      // Applying snapshot JSON into the local workbook Y.Doc mid-edit rebuilds
      // Y types and breaks UndoManager (undo restores keys, not text).
      if (!liveRef.current) return
      const doc = snap.document as SpreadsheetDocument | null
      if (!doc || !doc.sheets?.length) return
      skipOutbound.current = true
      onRemoteDocument(doc)
    },
    [onRemoteDocument]
  )

  const yjs = useCollabYDoc({
    enabled: Boolean(workbookId),
    sendUpdate: (u) => sendYUpdateRef.current(u),
    onRemoteMaterialize,
  })

  const applyRemoteUpdateRef = useRef(yjs.applyRemoteUpdate)
  applyRemoteUpdateRef.current = yjs.applyRemoteUpdate
  const seedFromSnapshotRef = useRef(yjs.seedFromSnapshot)
  seedFromSnapshotRef.current = yjs.seedFromSnapshot
  const lastSnapRef = useRef<CollabYSnapshot | null>(null)

  const onSnapshot = useCallback(
    (snap: {
      rev: number
      title: string
      templateId: string
      style: Record<string, unknown>
      document: unknown
    }) => {
      // Keep for safety seed only — do not push into local workbook undo CRDT.
      // Content sync is via yjs.sync / yjs.update once live.
      lastSnapRef.current = {
        title: snap.title,
        templateId: snap.templateId,
        style: snap.style,
        document: snap.document,
      }
    },
    []
  )

  const collab = useCollabRoom({
    kind: "spreadsheet",
    documentId: workbookId ?? "",
    enabled: Boolean(workbookId),
    shareToken,
    onSnapshot,
    onYjsSync: (u) => applyRemoteUpdateRef.current(u),
    onYjsUpdate: (u) => applyRemoteUpdateRef.current(u),
  })

  sendYUpdateRef.current = collab.sendYUpdate
  const permissions: CollabPermissions = collab.permissions
  liveRef.current = collab.live

  // Safety seed if yjs.sync never arrives
  useEffect(() => {
    if (!collab.live || !lastSnapRef.current) return
    const root = yjs.ydoc.getMap("root")
    if (root.size > 0) return
    seedFromSnapshotRef.current(lastSnapRef.current)
  }, [collab.live, yjs.ydoc])

  // Local → collab CRDT
  useEffect(() => {
    if (!collab.live || !canEdit || !localDocument) return
    if (skipOutbound.current) {
      skipOutbound.current = false
      return
    }
    if (!permissions.canEditContent) return
    setCollabDocument(yjs.ydoc, localDocument)
  }, [
    localDocument,
    collab.live,
    canEdit,
    permissions.canEditContent,
    yjs.ydoc,
  ])

  const [peerCount, setPeerCount] = useState(0)
  useEffect(() => {
    setPeerCount(collab.peers.length)
  }, [collab.peers.length])

  return {
    collab,
    permissions,
    peers: collab.peers,
    self: collab.self,
    live: collab.live,
    peerCount,
    roomError: collab.roomError,
    ydoc: yjs.ydoc,
  }
}
