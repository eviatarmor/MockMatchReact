import type { CollabEffectiveRole, CollabPermissions, DocumentKind } from "@mockmatch/schemas"

export type { CollabEffectiveRole, CollabPermissions, DocumentKind }

export type CollabCursorKind = "pointer" | "caret" | "selection"

/** Normalized 0–1 rect in document surface space. */
export type CollabNormRect = {
  x: number
  y: number
  w: number
  h: number
}

/** Monaco 1-based selection (IDE collab). */
export type CollabMonacoSel = {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

export type CollabCursor = {
  /** Anchor / caret / pointer position (0–1 of paper / editor surface). */
  x: number
  y: number
  kind?: CollabCursorKind
  /** Caret height in unscaled CSS px (kind caret). */
  h?: number
  /** Highlight boxes for non-collapsed text selection (kind selection). */
  rects?: CollabNormRect[]
  /** IDE: active file path / Monaco model id. */
  path?: string
  /** IDE: Monaco selection for decorations. */
  sel?: CollabMonacoSel
}

export type CollabPeer = {
  userId: string
  name: string
  color: string
  role: CollabEffectiveRole
  /** x/y are 0–1 of the **document surface** (paper), not the viewport. */
  cursor?: CollabCursor
}

export type CollabSaveStatus =
  | "idle"
  | "connecting"
  | "synced"
  | "error"
  | "room_full"
  /** Owner left — share session ended; peers should exit the editor. */
  | "room_closed"

export type CollabSnapshotMessage = {
  type: "snapshot"
  rev: number
  title: string
  templateId: string
  style: Record<string, unknown>
  document: unknown
  role: CollabEffectiveRole
  color: string
  self: CollabPeer
  peers: CollabPeer[]
}

export type CollabServerMessage =
  | CollabSnapshotMessage
  | {
      type: "doc.op"
      path: string
      value: unknown
      rev: number
      userId: string
    }
  /** Full Yjs state on join (base64 of encodeStateAsUpdate). */
  | { type: "yjs.sync"; update: string; rev: number }
  /** Incremental Yjs update from a peer (or echo). */
  | { type: "yjs.update"; update: string; rev: number; userId: string }
  | { type: "peer.joined"; peer: CollabPeer }
  | { type: "peer.left"; userId: string }
  /** Owner left the room — share session is over for everyone. */
  | { type: "room.closed"; reason: "owner_left" }
  /** Owner removed this collaborator from the share dialog. */
  | { type: "access.revoked"; reason: "removed" | string }
  /** Live role changed (e.g. edit → view) while still in the room. */
  | { type: "role.updated"; role: CollabEffectiveRole }
  | {
      type: "presence.cursor"
      userId: string
      name: string
      color: string
      /** True when peer left the paper — hide remote pointer. */
      clear?: boolean
      x?: number
      y?: number
      kind?: CollabCursorKind
      h?: number
      rects?: CollabNormRect[]
      path?: string
      sel?: CollabMonacoSel
    }
  | { type: "error"; code: string; message: string }
  /** Sandbox job accepted / about to exec (room-wide). */
  | {
      type: "sandbox.started"
      runId: string
      mode: "run" | "tests"
      userId: string
      command: string
    }
  | {
      type: "sandbox.output"
      runId: string
      stream: "stdout" | "stderr"
      chunk: string
    }
  | {
      type: "sandbox.finished"
      runId: string
      exitCode: number | null
      error?: string
      command?: string
      mode?: "run" | "tests"
    }
  | { type: "sandbox.busy"; message: string }
  /** Interactive PTY (per-peer, not room fan-out). */
  | { type: "sandbox.pty.ready" }
  | { type: "sandbox.pty.output"; data: string }
  | { type: "sandbox.pty.exit"; code: number | null }
  | { type: "sandbox.pty.error"; message: string }

/** Client → server sandbox request (workspace rooms). */
export type CollabSandboxRunMessage = {
  type: "sandbox.run"
  mode: "run" | "tests"
  entryPath?: string
  /** path → content; server falls back to snapshot if omitted. */
  files?: Record<string, string>
}

export type CollabSandboxStatus = "idle" | "running"

export type CollabPtyStatus = "closed" | "connecting" | "open" | "error"
