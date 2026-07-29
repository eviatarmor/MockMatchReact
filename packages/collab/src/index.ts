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
