/**
 * Product-agnostic undo/redo stack (document snapshots).
 * Surfaces (spreadsheet, whiteboard, …) supply clone + commit semantics.
 */

export type CreateHistoryStackOptions<T> = {
  /** Max past entries (default 100). */
  readonly limit?: number
  /** Deep / structural clone before storing on the stack. */
  readonly clone: (value: T) => T
  /**
   * Optional equality: if true, {@link HistoryStack.commit} is a no-op.
   * Default: reference equality (`===`).
   */
  readonly equals?: (a: T, b: T) => boolean
}

export type HistoryStack<T> = {
  readonly present: T
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly pastLength: number
  readonly futureLength: number
  /**
   * Push current present onto past, set `next` as present, clear future.
   * No-op when equals(present, next).
   */
  commit: (next: T) => T
  /** Replace present and clear both stacks (load / hard reset). */
  replace: (next: T) => T
  /** Replace present without touching stacks (remote sync). */
  setPresent: (next: T) => T
  undo: () => T
  redo: () => T
  /** Drop stacks; keep present. */
  clear: () => void
}

const DEFAULT_LIMIT = 100

/**
 * Snapshot undo/redo. Callers own mutation; pass the next document into
 * {@link HistoryStack.commit}.
 *
 * For live Yjs rooms prefer Y.UndoManager and keep this empty / disabled.
 */
export function createHistoryStack<T>(
  initial: T,
  options: CreateHistoryStackOptions<T>
): HistoryStack<T> {
  const limit = Math.max(1, options.limit ?? DEFAULT_LIMIT)
  const clone = options.clone
  const equals = options.equals ?? ((a, b) => a === b)

  let past: T[] = []
  let present = clone(initial)
  let future: T[] = []

  return {
    get present() {
      return present
    },
    get canUndo() {
      return past.length > 0
    },
    get canRedo() {
      return future.length > 0
    },
    get pastLength() {
      return past.length
    },
    get futureLength() {
      return future.length
    },
    commit(next: T) {
      if (equals(present, next)) return present
      past = [...past.slice(-(limit - 1)), clone(present)]
      present = clone(next)
      future = []
      return present
    },
    replace(next: T) {
      present = clone(next)
      past = []
      future = []
      return present
    },
    setPresent(next: T) {
      present = clone(next)
      return present
    },
    undo() {
      if (past.length === 0) return present
      const prev = past[past.length - 1]!
      past = past.slice(0, -1)
      future = [clone(present), ...future]
      present = clone(prev)
      return present
    },
    redo() {
      if (future.length === 0) return present
      const next = future[0]!
      future = future.slice(1)
      past = [...past, clone(present)]
      present = clone(next)
      return present
    },
    clear() {
      past = []
      future = []
    },
  }
}
