import {
  applyCommand,
  type WhiteboardCommand,
  type WhiteboardDocument,
} from "@mockmatch/whiteboard"

/** Solo snapshot stack + live setPresent mirror (no undo wipe). */
export type WhiteboardHistoryApi = {
  dispatch: (command: WhiteboardCommand) => WhiteboardDocument
  undo: () => WhiteboardDocument
  redo: () => WhiteboardDocument
  setPresent: (doc: WhiteboardDocument) => void
}

export type BoardDocSink = {
  setDocRef: (doc: WhiteboardDocument) => void
  setDoc: (doc: WhiteboardDocument) => void
}

function commitDoc(
  next: WhiteboardDocument,
  sink: BoardDocSink,
  historyPresent?: WhiteboardHistoryApi["setPresent"]
): void {
  sink.setDocRef(next)
  historyPresent?.(next)
  sink.setDoc(next)
}

/**
 * Live room: apply command outside snapshot history; Y.UndoManager tracks
 * the outbound setCollabDocument mirror. No-op when document unchanged.
 */
export function applyLiveCommand(
  present: WhiteboardDocument,
  command: WhiteboardCommand,
  history: Pick<WhiteboardHistoryApi, "setPresent">,
  sink: BoardDocSink
): boolean {
  const next = applyCommand(present, command)
  if (next === present) return false
  commitDoc(next, sink, history.setPresent)
  return true
}

/** Solo: snapshot history + optional save schedule via afterSolo. */
export function applySoloCommand(
  command: WhiteboardCommand,
  history: Pick<WhiteboardHistoryApi, "dispatch">,
  sink: BoardDocSink,
  afterSolo: (doc: WhiteboardDocument) => void
): void {
  const next = history.dispatch(command)
  commitDoc(next, sink)
  afterSolo(next)
}

/**
 * Live undo/redo: materialize from Y.UndoManager; skip when stack empty.
 */
export function applyLiveHistoryStep(
  next: WhiteboardDocument | null,
  history: Pick<WhiteboardHistoryApi, "setPresent">,
  sink: BoardDocSink
): boolean {
  if (!next) return false
  commitDoc(next, sink, history.setPresent)
  return true
}

/** Solo undo/redo: apply stack result + afterSolo (flags + scheduleSave). */
export function applySoloHistoryStep(
  next: WhiteboardDocument,
  sink: BoardDocSink,
  afterSolo: (doc: WhiteboardDocument) => void
): void {
  commitDoc(next, sink)
  afterSolo(next)
}
