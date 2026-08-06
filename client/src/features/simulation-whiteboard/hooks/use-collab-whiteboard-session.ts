import { useCallback, useEffect, useRef, useState } from "react"
import * as Y from "yjs"
import {
  createCollabDocumentUndoManager,
  materializeCollabYDoc,
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
  /** Apply remote whiteboard document (materialize into React state). */
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
 *
 * While live, undo/redo is {@link Y.UndoManager} on the collab Y.Doc (local
 * origin only). Remote `applyUpdate` is untracked so peer merges do not wipe
 * local undo. Solo (non-live) hosts keep snapshot history in the page.
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
  const undoManagerRef = useRef<Y.UndoManager | null>(null)
  const [liveCanUndo, setLiveCanUndo] = useState(false)
  const [liveCanRedo, setLiveCanRedo] = useState(false)

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

  // Live: Y.UndoManager tracks local setCollabDocument only.
  useEffect(() => {
    if (!collab.live) {
      const prev = undoManagerRef.current
      if (prev) {
        prev.destroy()
        undoManagerRef.current = null
      }
      setLiveCanUndo(false)
      setLiveCanRedo(false)
      return
    }

    const um = createCollabDocumentUndoManager(yjs.ydoc, {
      // Board commands are discrete; keep each setCollabDocument as one step
      // when the host stops capturing after mirror. Timeout still groups drags.
      captureTimeout: 300,
    })
    undoManagerRef.current = um

    const syncStacks = () => {
      setLiveCanUndo(um.undoStack.length > 0)
      setLiveCanRedo(um.redoStack.length > 0)
    }
    um.on("stack-item-added", syncStacks)
    um.on("stack-item-popped", syncStacks)
    um.on("stack-cleared", syncStacks)
    syncStacks()

    return () => {
      um.off("stack-item-added", syncStacks)
      um.off("stack-item-popped", syncStacks)
      um.off("stack-cleared", syncStacks)
      um.destroy()
      if (undoManagerRef.current === um) undoManagerRef.current = null
    }
  }, [collab.live, yjs.ydoc])

  // Safety seed if yjs.sync never arrives
  useEffect(() => {
    if (!collab.live || !lastSnapRef.current) return
    const root = yjs.ydoc.getMap("root")
    if (root.size > 0) return
    seedFromSnapshotRef.current(lastSnapRef.current)
  }, [collab.live, yjs.ydoc])

  // Local → collab CRDT (tracked local origin for UndoManager)
  useEffect(() => {
    if (!collab.live || !canEdit || !localDocument) return
    if (skipOutbound.current) {
      skipOutbound.current = false
      return
    }
    if (!permissions.canEditContent) return
    setCollabDocument(yjs.ydoc, localDocument)
    // End capture group so the next command is a separate undo step (unless
    // rapid drag commits land inside captureTimeout).
    undoManagerRef.current?.stopCapturing()
  }, [
    localDocument,
    collab.live,
    canEdit,
    permissions.canEditContent,
    yjs.ydoc,
  ])

  const materializeBoard = useCallback((): WhiteboardDocument | null => {
    const snap = materializeCollabYDoc(yjs.ydoc)
    return isWhiteboardDoc(snap.document) ? snap.document : null
  }, [yjs.ydoc])

  /** Undo last local collab edit; returns materialize for React state. */
  const undoLive = useCallback((): WhiteboardDocument | null => {
    const um = undoManagerRef.current
    if (!um || um.undoStack.length === 0) return null
    um.undo()
    skipOutbound.current = true
    return materializeBoard()
  }, [materializeBoard])

  /** Redo last local collab edit. */
  const redoLive = useCallback((): WhiteboardDocument | null => {
    const um = undoManagerRef.current
    if (!um || um.redoStack.length === 0) return null
    um.redo()
    skipOutbound.current = true
    return materializeBoard()
  }, [materializeBoard])

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
    ydoc: yjs.ydoc,
    /** Live-only undo stack flags (false when not live). */
    liveCanUndo,
    liveCanRedo,
    undoLive,
    redoLive,
  }
}
