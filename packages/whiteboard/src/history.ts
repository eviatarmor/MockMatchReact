import { createHistoryStack } from "@mockmatch/history"
import { applyCommand, cloneDocument } from "./document"
import type { WhiteboardCommand, WhiteboardDocument } from "./types"

const DEFAULT_LIMIT = 100

/**
 * Consecutive sticky/text/label keystrokes within this window share one undo step.
 * After a pause, the next keystroke starts a new step (session debounce).
 */
export const TEXT_TYPING_BATCH_MS = 500

const TEXT_TYPING_KEYS = new Set(["text", "label"])

type TextTypingBatch = {
  readonly id: string
  readonly keys: ReadonlySet<string>
  lastAt: number
}

/**
 * Pure text/label patches only (sticky text, free text, shape label).
 * Mixed patches (e.g. text + color) are discrete history steps.
 */
export function isTextTypingPatch(
  command: WhiteboardCommand
): { id: string; keys: string[] } | null {
  if (command.type !== "patch") return null
  const keys = Object.keys(command.patch)
  if (keys.length === 0) return null
  if (!keys.every((k) => TEXT_TYPING_KEYS.has(k))) return null
  return { id: command.id, keys }
}

/**
 * Solo undo/redo stack (snapshots via `@mockmatch/history`).
 * For live Yjs rooms, host should use Y.UndoManager instead.
 *
 * Sticky/text typing is batched: the first keystroke of a session pushes one
 * history entry; further patches to the same field(s) within
 * {@link TEXT_TYPING_BATCH_MS} update present without new steps.
 */
export function createHistory(
  initial: WhiteboardDocument,
  limit = DEFAULT_LIMIT
) {
  const stack = createHistoryStack(initial, {
    clone: cloneDocument,
    limit,
  })

  let textBatch: TextTypingBatch | null = null

  function clearTextBatch() {
    textBatch = null
  }

  function shouldCoalesce(id: string, keys: string[], now: number): boolean {
    if (!textBatch) return false
    if (textBatch.id !== id) return false
    if (!keys.every((k) => textBatch!.keys.has(k))) return false
    if (now - textBatch.lastAt > TEXT_TYPING_BATCH_MS) return false
    return true
  }

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
      clearTextBatch()
      stack.replace(doc)
    },
    /** Replace present without clearing history (remote materialize). */
    setPresent(doc: WhiteboardDocument) {
      clearTextBatch()
      stack.setPresent(doc)
    },
    dispatch(command: WhiteboardCommand): WhiteboardDocument {
      const next = applyCommand(stack.present, command)
      const typing = isTextTypingPatch(command)
      const now = Date.now()

      if (typing && shouldCoalesce(typing.id, typing.keys, now)) {
        textBatch = {
          id: textBatch!.id,
          keys: textBatch!.keys,
          lastAt: now,
        }
        return stack.setPresent(next)
      }

      if (typing) {
        textBatch = {
          id: typing.id,
          keys: new Set(typing.keys),
          lastAt: now,
        }
      } else {
        clearTextBatch()
      }

      return stack.commit(next)
    },
    undo(): WhiteboardDocument {
      clearTextBatch()
      return stack.undo()
    },
    redo(): WhiteboardDocument {
      clearTextBatch()
      return stack.redo()
    },
  }
}

export type WhiteboardHistory = ReturnType<typeof createHistory>
