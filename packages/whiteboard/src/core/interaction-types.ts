import type { ReactNode } from "react"
import type {
  WhiteboardCommand,
  WhiteboardDocument,
  WhiteboardTool,
} from "../types"

/** Normalized board pointer (client + board space). */
export type BoardPointer = {
  readonly clientX: number
  readonly clientY: number
  readonly boardX: number
  readonly boardY: number
  readonly button: number
  readonly buttons: number
  readonly detail: number
  readonly pointerId: number
  readonly shiftKey: boolean
  readonly altKey: boolean
  readonly metaKey: boolean
  readonly ctrlKey: boolean
  preventDefault: () => void
  stopPropagation: () => void
}

/**
 * Opaque gesture state owned by the active tool for the duration of a drag.
 * `type` is a tool-defined discriminant (e.g. "stroke", "marquee").
 */
export type ToolGesture = {
  readonly type: string
  [key: string]: unknown
}

/**
 * API the core host gives every tool. Tools never import canvas internals.
 * Options (penStyle, shapeKind, …) are a generic bag so core stays tool-agnostic.
 */
export type InteractionHost = {
  readonly getDocument: () => WhiteboardDocument
  readonly getTool: () => WhiteboardTool | string
  readonly getSelectedIds: () => readonly string[]
  readonly getEditingId: () => string | null
  readonly canEdit: () => boolean
  readonly dispatch: (command: WhiteboardCommand) => void
  readonly setSelectedIds: (ids: string[]) => void
  readonly setEditingId: (id: string | null) => void
  readonly clientToBoard: (
    clientX: number,
    clientY: number
  ) => { x: number; y: number }
  readonly hitTestAt: (boardX: number, boardY: number) => string | null
  /** Read host/rail options without core knowing shape/pen types. */
  readonly getOption: <T>(key: string, fallback: T) => T
  /**
   * Transient overlay (draft stroke, marquee, connector line).
   * Pass `null` to clear one key; tools clear on pointer-up.
   */
  readonly setOverlay: (key: string, node: ReactNode | null) => void
  readonly clearOverlays: () => void
  /**
   * Board feature pipeline: shape-label / text-edit on select double-activate.
   * Returns true if a feature handled it.
   */
  readonly runSelectDoubleActivate: (
    elementId: string,
    boardX: number,
    boardY: number
  ) => boolean
  readonly isNativeTextTarget: (target: EventTarget | null) => boolean
}

/**
 * Interaction tool — the real unit of board behavior.
 * Registered by tool modules (draw, connector, select, …). Core only dispatches.
 */
export type ToolDefinition = {
  readonly id: string
  readonly cursor?: string
  /** When true, element hit-targets are disabled so strokes reach the board. */
  readonly passThroughElements?: boolean
  /**
   * Start a gesture. Return a ToolGesture to capture move/up on the host;
   * return void/null for a one-shot click (no drag session).
   */
  readonly onPointerDown?: (
    pointer: BoardPointer,
    host: InteractionHost
  ) => ToolGesture | null | void
  readonly onPointerMove?: (
    pointer: BoardPointer,
    gesture: ToolGesture,
    host: InteractionHost
  ) => ToolGesture | void
  readonly onPointerUp?: (
    pointer: BoardPointer,
    gesture: ToolGesture,
    host: InteractionHost
  ) => void
}

/** Build registry id → tool from modules. Later tools override earlier same id. */
export function buildToolRegistry(
  tools: readonly ToolDefinition[]
): Map<string, ToolDefinition> {
  const map = new Map<string, ToolDefinition>()
  for (const t of tools) map.set(t.id, t)
  return map
}

export function pointerFromEvent(
  e: {
    clientX: number
    clientY: number
    button: number
    buttons: number
    detail: number
    pointerId: number
    shiftKey: boolean
    altKey: boolean
    metaKey: boolean
    ctrlKey: boolean
    preventDefault: () => void
    stopPropagation: () => void
  },
  board: { x: number; y: number }
): BoardPointer {
  return {
    clientX: e.clientX,
    clientY: e.clientY,
    boardX: board.x,
    boardY: board.y,
    button: e.button,
    buttons: e.buttons,
    detail: e.detail,
    pointerId: e.pointerId,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
    ctrlKey: e.ctrlKey,
    preventDefault: () => e.preventDefault(),
    stopPropagation: () => e.stopPropagation(),
  }
}
