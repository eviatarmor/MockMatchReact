export type {
  CollabCursorKind,
  CollabNormRect,
  CollabMonacoSel,
  CollabCursor,
  CollabPeer,
  CollabSaveStatus,
  CollabSnapshotMessage,
  CollabServerMessage,
  CollabEffectiveRole,
  CollabPermissions,
  DocumentKind,
} from "./types"

export { permissionsForRole } from "./permissions"
export { getByPath, setByPath } from "./apply-path-op"
export {
  getDomSelectionCaretClientRect,
  getDomSelectionClientRects,
  getTextFieldCaretClientRect,
  getTextFieldSelectionClientRects,
} from "./caret-coords"

export {
  useCollabRoom,
  type FetchCollabTicket,
  type CollabWsTicket,
} from "./use-collab-room"
export {
  useCollabSurface,
  type SendCursor,
  type SendCursorMeta,
} from "./use-collab-surface"

export { PresenceAvatarStack } from "./presence-avatar-stack"
export { RemoteCursors } from "./remote-cursors"
export { RoomFullGate } from "./room-full-gate"
export {
  COLLAB_SELECTION_OPACITY,
  COLLAB_CARET_GLOW_ALPHA,
  parseHexColor,
  collabSelectionBackground,
  collabSolidColor,
  collabCaretBoxShadow,
} from "./presence-colors"

export {
  createCollabYDoc,
  seedCollabYDoc,
  materializeCollabYDoc,
  setCollabTitle,
  setCollabTemplateId,
  setCollabStyle,
  setCollabDocument,
  createCollabDocumentUndoManager,
  applyCollabYSnapshot,
  encodeYUpdate,
  decodeYUpdate,
  applyRemoteYUpdate,
  encodeFullYState,
  Y_ORIGIN_REMOTE,
  Y_ORIGIN_LOCAL,
  COLLAB_Y_ROOT,
  type CollabYSnapshot,
} from "./yjs/collab-ydoc"
export { useCollabYDoc } from "./yjs/use-collab-ydoc"
export { jsonToY, yToJson, mergeJsonIntoY } from "./yjs/json-y"
