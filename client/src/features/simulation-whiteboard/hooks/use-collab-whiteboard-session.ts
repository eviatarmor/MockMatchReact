import { useCallback, useEffect, useRef } from "react"
import {
  setCollabDocument,
  useCollabYDoc,
  type CollabYSnapshot,
} from "@mockmatch/collab"
import type { WhiteboardDocument } from "@mockmatch/whiteboard"
import { useCollabRoom } from "@/features/collab/hooks/use-collab-room"
import type { CollabPermissions } from "@/features/collab/types"

type Args = {
  readonly boardId: string | null
  readonly shareToken?: string | null
  /** Apply remote whiteboard document (replace local seed). */
  readonly onRemoteDocument: (doc: WhiteboardDocument) => void
  /** Current local document for outbound CRDT mirror. */
  readonly localDocument: WhiteboardDocument | null
  readonly canEdit: boolean
}

function isWhiteboardDoc(v: unknown): v is WhiteboardDocument {
  return (
    Boolean(v) &&
    typeof v === "object" &&
    (v as WhiteboardDocument).version === 1 &&
    typeof (v as WhiteboardDocument).elements === "object"
  )
}

/**
 * Live collab for whiteboard boards (`document_kind: whiteboard`).
 * Presence avatars + remote cursors via room; document via Yjs.
 */
export function useCollabWhiteboardSession({
  boardId,
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
      if (!liveRef.current) return
      const doc = snap.document
      if (!isWhiteboardDoc(doc)) return
      skipOutbound.current = true
      onRemoteDocument(doc)
    },
    [onRemoteDocument]
  )

  const yjs = useCollabYDoc({
    enabled: Boolean(boardId),
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
    kind: "whiteboard",
    documentId: boardId ?? "",
    enabled: Boolean(boardId),
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

  // Local → collab CRDT (debounced lightly by effect batching)
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

  return {
    collab,
    permissions,
    peers: collab.peers,
    self: collab.self,
    status: collab.status,
    live: collab.live,
    connected: collab.connected,
    roomError: collab.roomError,
    sendCursor: collab.sendCursor,
    clearCursor: collab.clearCursor,
  }
}
