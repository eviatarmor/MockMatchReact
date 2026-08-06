import { useCallback, useEffect, useRef, useState } from "react"
import {
  createCollabDocumentUndoManager,
  createCollabYDoc,
  materializeCollabYDoc,
} from "@mockmatch/collab"
import type { WhiteboardDocument } from "@mockmatch/whiteboard"

type CollabYDoc = ReturnType<typeof createCollabYDoc>
type CollabDocumentUndoManager = ReturnType<
  typeof createCollabDocumentUndoManager
>

function isWhiteboardDoc(v: unknown): v is WhiteboardDocument {
  return (
    Boolean(v) &&
    typeof v === "object" &&
    (v as WhiteboardDocument).version === 1 &&
    typeof (v as WhiteboardDocument).elements === "object"
  )
}

function materializeWhiteboard(ydoc: CollabYDoc): WhiteboardDocument | null {
  const snap = materializeCollabYDoc(ydoc)
  return isWhiteboardDoc(snap.document) ? snap.document : null
}

function undoLiveStack(
  um: CollabDocumentUndoManager | null,
  ydoc: CollabYDoc
): WhiteboardDocument | null {
  if (!um || um.undoStack.length === 0) return null
  um.undo()
  return materializeWhiteboard(ydoc)
}

function redoLiveStack(
  um: CollabDocumentUndoManager | null,
  ydoc: CollabYDoc
): WhiteboardDocument | null {
  if (!um || um.redoStack.length === 0) return null
  um.redo()
  return materializeWhiteboard(ydoc)
}

function attachUndoStackListeners(
  um: CollabDocumentUndoManager,
  syncStacks: () => void
): () => void {
  um.on("stack-item-added", syncStacks)
  um.on("stack-item-popped", syncStacks)
  um.on("stack-cleared", syncStacks)
  syncStacks()
  return () => {
    um.off("stack-item-added", syncStacks)
    um.off("stack-item-popped", syncStacks)
    um.off("stack-cleared", syncStacks)
    um.destroy()
  }
}

/**
 * Y.UndoManager on the collab Y.Doc while the room is live.
 * Local `setCollabDocument` origin only; remote applyUpdate is untracked.
 */
export function useCollabLiveUndo(live: boolean, ydoc: CollabYDoc) {
  const undoManagerRef = useRef<CollabDocumentUndoManager | null>(null)
  const [liveCanUndo, setLiveCanUndo] = useState(false)
  const [liveCanRedo, setLiveCanRedo] = useState(false)

  useEffect(() => {
    if (!live) {
      const prev = undoManagerRef.current
      if (prev) {
        prev.destroy()
        undoManagerRef.current = null
      }
      setLiveCanUndo(false)
      setLiveCanRedo(false)
      return
    }

    const um = createCollabDocumentUndoManager(ydoc, {
      // Board commands are discrete; keep each setCollabDocument as one step
      // when the host stops capturing after mirror. Timeout still groups drags.
      captureTimeout: 300,
    })
    undoManagerRef.current = um

    const syncStacks = () => {
      setLiveCanUndo(um.undoStack.length > 0)
      setLiveCanRedo(um.redoStack.length > 0)
    }
    const detach = attachUndoStackListeners(um, syncStacks)

    return () => {
      detach()
      if (undoManagerRef.current === um) undoManagerRef.current = null
    }
  }, [live, ydoc])

  const undoLive = useCallback(
    (): WhiteboardDocument | null =>
      undoLiveStack(undoManagerRef.current, ydoc),
    [ydoc]
  )

  const redoLive = useCallback(
    (): WhiteboardDocument | null =>
      redoLiveStack(undoManagerRef.current, ydoc),
    [ydoc]
  )

  const stopCapturing = useCallback(() => {
    undoManagerRef.current?.stopCapturing()
  }, [])

  return {
    liveCanUndo,
    liveCanRedo,
    undoLive,
    redoLive,
    stopCapturing,
  }
}
