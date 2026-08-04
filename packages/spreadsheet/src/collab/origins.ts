/** Local user edits — tracked by Y.UndoManager. */
export const SS_ORIGIN_LOCAL = "ss-local"
/** Remote CRDT merges — not undoable as local steps. */
export const SS_ORIGIN_REMOTE = "ss-remote"
/** Auto bounds / system — not undoable. */
export const SS_ORIGIN_SYSTEM = "ss-system"
