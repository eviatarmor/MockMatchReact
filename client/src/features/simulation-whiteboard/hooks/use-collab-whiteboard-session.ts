import { useCallback, useEffect, useRef } from "react"
import { setCollabDocument } from "@mockmatch/collab"
import type { WhiteboardDocument } from "@mockmatch/whiteboard"
import { useCollabLiveUndo } from "./use-collab-live-undo"
import { useWhiteboardCollabRoom } from "./use-whiteboard-collab-room"

type Args = {
  readonly boardId: string | null
  readonly shareToken?: string | null
  /** Apply remote whiteboard document (materialize into React state). */
  readonly onRemoteDocument: (doc: WhiteboardDocument) => void
  /** Current local document for outbound CRDT mirror. */
  readonly localDocument: WhiteboardDocument | null
  readonly canEdit: boolean
}

type MirrorArgs = {
  readonly live: boolean
  readonly canEdit: boolean
  readonly canEditContent: boolean
  readonly localDocument: WhiteboardDocument | null
  readonly ydoc: Parameters<typeof setCollabDocument>[0]
  readonly skipOutbound: { current: boolean }
  readonly stopCapturing: () => void
}

/** Consume one-shot skip so remote materialize / undo does not re-broadcast. */
function takeSkipOutbound(skipOutbound: { current: boolean }): boolean {
  if (!skipOutbound.current) return false
  skipOutbound.current = false
  return true
}

function isMirrorReady(
  live: boolean,
  canEdit: boolean,
  canEditContent: boolean,
  localDocument: WhiteboardDocument | null
): localDocument is WhiteboardDocument {
  return Boolean(live && canEdit && canEditContent && localDocument)
}

/** Local board → shared Y.Doc (tracked origin for UndoManager). */
function mirrorLocalToCollab({
  live,
  canEdit,
  canEditContent,
  localDocument,
  ydoc,
  skipOutbound,
  stopCapturing,
}: MirrorArgs): void {
  if (takeSkipOutbound(skipOutbound)) return
  if (!isMirrorReady(live, canEdit, canEditContent, localDocument)) return
  setCollabDocument(ydoc, localDocument)
  // End capture group so the next command is a separate undo step (unless
  // rapid drag commits land inside captureTimeout).
  stopCapturing()
}

function markSkipOutboundAfterStackOp(
  doc: WhiteboardDocument | null,
  skipOutbound: { current: boolean }
): WhiteboardDocument | null {
  if (doc) skipOutbound.current = true
  return doc
}

/**
 * Live collab for whiteboard boards (`document_kind: whiteboard`).
 * Presence avatars + remote cursors via room; document via Yjs.
 *
 * While live, undo/redo is Y.UndoManager on the collab Y.Doc (local origin
 * only). Remote applyUpdate is untracked so peer merges do not wipe local
 * undo. Solo (non-live) hosts keep snapshot history in the page.
 */
export function useCollabWhiteboardSession({
  boardId,
  shareToken,
  onRemoteDocument,
  localDocument,
  canEdit,
}: Args) {
  const skipOutbound = useRef(false)

  const { collab, permissions, ydoc } = useWhiteboardCollabRoom({
    boardId,
    shareToken,
    onRemoteDocument,
    skipOutbound,
  })

  const liveUndo = useCollabLiveUndo(collab.live, ydoc)

  useEffect(() => {
    mirrorLocalToCollab({
      live: collab.live,
      canEdit,
      canEditContent: permissions.canEditContent,
      localDocument,
      ydoc,
      skipOutbound,
      stopCapturing: liveUndo.stopCapturing,
    })
  }, [
    localDocument,
    collab.live,
    canEdit,
    permissions.canEditContent,
    ydoc,
    liveUndo.stopCapturing,
  ])

  const undoLive = useCallback(
    (): WhiteboardDocument | null =>
      markSkipOutboundAfterStackOp(liveUndo.undoLive(), skipOutbound),
    [liveUndo.undoLive]
  )

  const redoLive = useCallback(
    (): WhiteboardDocument | null =>
      markSkipOutboundAfterStackOp(liveUndo.redoLive(), skipOutbound),
    [liveUndo.redoLive]
  )

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
    ydoc,
    /** Live-only undo stack flags (false when not live). */
    liveCanUndo: liveUndo.liveCanUndo,
    liveCanRedo: liveUndo.liveCanRedo,
    undoLive,
    redoLive,
  }
}
