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

export type CollabCursor = {
  /** Anchor / caret / pointer position (0–1 of paper). */
  x: number
  y: number
  kind?: CollabCursorKind
  /** Caret height in unscaled CSS px (kind caret). */
  h?: number
  /** Highlight boxes for non-collapsed text selection (kind selection). */
  rects?: CollabNormRect[]
}

export type CollabPeer = {
  userId: string
  name: string
  color: string
  role: CollabEffectiveRole
  /** x/y are 0–1 of the **document surface** (paper), not the viewport. */
  cursor?: CollabCursor
}

export type CollabSaveStatus = "idle" | "connecting" | "synced" | "error" | "room_full"

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
  | { type: "peer.joined"; peer: CollabPeer }
  | { type: "peer.left"; userId: string }
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
    }
  | { type: "error"; code: string; message: string }
