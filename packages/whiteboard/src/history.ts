import { applyCommand, cloneDocument } from "./document"
import type { WhiteboardCommand, WhiteboardDocument } from "./types"

const DEFAULT_LIMIT = 100

/**
 * Solo undo/redo stack (snapshots). For live Yjs rooms, host should use
 * Y.UndoManager instead and keep this disabled or empty.
 */
export function createHistory(initial: WhiteboardDocument, limit = DEFAULT_LIMIT) {
  let past: WhiteboardDocument[] = []
  let present = cloneDocument(initial)
  let future: WhiteboardDocument[] = []

  return {
    get document() {
      return present
    },
    get canUndo() {
      return past.length > 0
    },
    get canRedo() {
      return future.length > 0
    },
    replace(doc: WhiteboardDocument) {
      present = cloneDocument(doc)
      past = []
      future = []
    },
    /** Replace present without clearing history (remote materialize). */
    setPresent(doc: WhiteboardDocument) {
      present = cloneDocument(doc)
    },
    dispatch(command: WhiteboardCommand): WhiteboardDocument {
      const next = applyCommand(present, command)
      if (next === present) return present
      past = [...past.slice(-(limit - 1)), cloneDocument(present)]
      present = next
      future = []
      return present
    },
    undo(): WhiteboardDocument {
      if (past.length === 0) return present
      const prev = past[past.length - 1]!
      past = past.slice(0, -1)
      future = [cloneDocument(present), ...future]
      present = cloneDocument(prev)
      return present
    },
    redo(): WhiteboardDocument {
      if (future.length === 0) return present
      const next = future[0]!
      future = future.slice(1)
      past = [...past, cloneDocument(present)]
      present = cloneDocument(next)
      return present
    },
  }
}

export type WhiteboardHistory = ReturnType<typeof createHistory>
