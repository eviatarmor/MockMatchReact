export type {
  CollabCursorKind,
  CollabNormRect,
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
} from "./use-collab-surface"

export { PresenceAvatarStack } from "./presence-avatar-stack"
export { RemoteCursors } from "./remote-cursors"
export { RoomFullGate } from "./room-full-gate"

export {
  createCollabYDoc,
  seedCollabYDoc,
  materializeCollabYDoc,
  setCollabTitle,
  setCollabTemplateId,
  setCollabStyle,
  setCollabDocument,
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
