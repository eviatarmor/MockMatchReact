import { createHistoryStack } from "@mockmatch/history"
import { applyCommand, cloneDocument } from "./document"
import type { WhiteboardCommand, WhiteboardDocument } from "./types"

const DEFAULT_LIMIT = 100

/**
 * Solo undo/redo stack (snapshots via `@mockmatch/history`).
 *
 * Live Yjs rooms must **not** use this stack for undo/redo:
 * remote materialize used to call {@link WhiteboardHistory.replace} and wipe
 * past/future. Host should use `@mockmatch/collab` `createCollabDocumentUndoManager`
 * (tracked local origin) while live and keep this stack for solo only.
 */
export function createHistory(
  initial: WhiteboardDocument,
  limit = DEFAULT_LIMIT
) {
  const stack = createHistoryStack(initial, {
    clone: cloneDocument,
    limit,
  })

  return {
    get document() {
      return stack.present
    },
    get canUndo() {
      return stack.canUndo
    },
    get canRedo() {
      return stack.canRedo
    },
    replace(doc: WhiteboardDocument) {
      stack.replace(doc)
    },
    /** Replace present without clearing history (remote materialize). */
    setPresent(doc: WhiteboardDocument) {
      stack.setPresent(doc)
    },
    dispatch(command: WhiteboardCommand): WhiteboardDocument {
      const next = applyCommand(stack.present, command)
      return stack.commit(next)
    },
    undo(): WhiteboardDocument {
      return stack.undo()
    },
    redo(): WhiteboardDocument {
      return stack.redo()
    },
  }
}

export type WhiteboardHistory = ReturnType<typeof createHistory>
