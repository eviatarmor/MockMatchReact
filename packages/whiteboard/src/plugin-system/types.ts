import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import type { ToolDefinition } from "../core/interaction-types"
import type {
  DrawStrokeStyle,
  DrawStyleBarLabels,
  ShapeKind,
  WhiteboardCommand,
  WhiteboardDocument,
  WhiteboardElement,
  WhiteboardTool,
} from "../types"
import type { WhiteboardToolRailLabels } from "../tool-rail-labels"
import type { ElementViewProps } from "../canvas/element-types"

// ─── Host context ───────────────────────────────────────────────

/** Live viewport snapshot for chrome plugins. */
export type ViewportAccess = {
  readonly scale: number
  readonly positionX: number
  readonly positionY: number
  readonly boardSize: number
  readonly centerOnBoardPoint: (bx: number, by: number) => void
  readonly setTransform: (x: number, y: number, scale: number) => void
  readonly getWrapperSize: () => { w: number; h: number }
  /** Pan/zoom without re-rendering the board (DOM/chrome updates). */
  readonly subscribeTransform: (listener: () => void) => () => void
}

/** API every plugin receives from the host. */
export type WhiteboardPluginContext = {
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
  readonly isNativeTextTarget: (target: EventTarget | null) => boolean
  /** Present when host bound a viewport (canvas + chrome). */
  readonly getViewport?: () => ViewportAccess | null
}

export type PluginDoubleClickEvent = {
  readonly clientX: number
  readonly clientY: number
  readonly boardX: number
  readonly boardY: number
  readonly hitId: string | null
}

export type PluginSelectDoubleActivateEvent = {
  readonly elementId: string
  readonly boardX: number
  readonly boardY: number
}

// ─── Rail contribution ──────────────────────────────────────────

export type ToolRailApi = {
  readonly tool: WhiteboardTool
  readonly setTool: (tool: WhiteboardTool) => void
  readonly secondary: string | null
  readonly setSecondary: (group: string | null) => void
  readonly labels: WhiteboardToolRailLabels
  readonly drawStyleLabels: DrawStyleBarLabels
  readonly shapeKind: ShapeKind
  readonly setShapeKind: (kind: ShapeKind) => void
  readonly penStyle: DrawStrokeStyle
  readonly highlighterStyle: DrawStrokeStyle
  readonly smartStyle: DrawStrokeStyle
  readonly setPenStyle: (s: DrawStrokeStyle) => void
  readonly setHighlighterStyle: (s: DrawStrokeStyle) => void
  readonly setSmartStyle: (s: DrawStrokeStyle) => void
  readonly stickyColor: string
  readonly setStickyColor: (color: string) => void
  readonly shapeColor: string
  readonly setShapeColor: (color: string) => void
  readonly disabled?: boolean
}

export type ToolPrimaryButton = {
  readonly id: string
  readonly icon: LucideIcon
  readonly hotkey?: string
  readonly resolveLabel: (labels: WhiteboardToolRailLabels) => string
  readonly isActive: (api: ToolRailApi) => boolean
  readonly onClick: (api: ToolRailApi) => void
}

export type ToolSecondaryPanel = {
  readonly group: string
  readonly resolveAriaLabel: (labels: WhiteboardToolRailLabels) => string
  readonly isOpen: (api: ToolRailApi) => boolean
  readonly render: (api: ToolRailApi) => ReactNode
}

export type PluginRailContribution = {
  /** Sort order on the primary rail (lower first). */
  readonly order: number
  readonly primary?: ToolPrimaryButton
  readonly secondary?: ToolSecondaryPanel
}

// ─── Element type contribution ──────────────────────────────────

export type ElementTypeContribution = {
  readonly type: WhiteboardElement["type"]
  readonly render: (props: ElementViewProps) => ReactNode
}

// ─── Unified plugin ─────────────────────────────────────────────

/**
 * One plugin model for everything: select, draw, connector, clipboard, …
 *
 * Contribute any subset of:
 * - `tools` — pointer interaction
 * - `rail` — left bar
 * - keydown / double-click hooks
 * - `renderOverlay` — board-space layer
 * - `renderChrome` — screen-space chrome
 * - `elements` — element type renderers
 */
export type WhiteboardPlugin = {
  readonly id: string
  /** Feature/hook pipeline order (lower first). Default 100. */
  readonly order?: number
  readonly tools?: readonly ToolDefinition[]
  readonly rail?: PluginRailContribution
  readonly elements?: readonly ElementTypeContribution[]
  readonly setup?: (ctx: WhiteboardPluginContext) => void | (() => void)
  readonly onKeyDown?: (
    e: KeyboardEvent,
    ctx: WhiteboardPluginContext
  ) => boolean | void
  readonly onDoubleClick?: (
    e: PluginDoubleClickEvent,
    ctx: WhiteboardPluginContext
  ) => boolean | void
  readonly onSelectDoubleActivate?: (
    e: PluginSelectDoubleActivateEvent,
    ctx: WhiteboardPluginContext
  ) => boolean | void
  /** Board-space overlay (world coordinates). */
  readonly renderOverlay?: (ctx: WhiteboardPluginContext) => ReactNode
  /**
   * Screen-space chrome (fixed UI overlays).
   * Host places these outside the transform layer.
   */
  readonly renderChrome?: (ctx: WhiteboardPluginContext) => ReactNode
}

/** @deprecated Use WhiteboardPlugin — tools and features are the same thing. */
export type WhiteboardToolPlugin = WhiteboardPlugin

export function sortPlugins(
  plugins: readonly WhiteboardPlugin[]
): WhiteboardPlugin[] {
  return [...plugins].sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
}

export function sortRailPlugins(
  plugins: readonly WhiteboardPlugin[]
): WhiteboardPlugin[] {
  return [...plugins]
    .filter((p) => p.rail)
    .sort((a, b) => (a.rail!.order ?? 100) - (b.rail!.order ?? 100))
}

export function collectTools(
  plugins: readonly WhiteboardPlugin[]
): ToolDefinition[] {
  const out: ToolDefinition[] = []
  for (const p of sortPlugins(plugins)) {
    if (p.tools) out.push(...p.tools)
  }
  return out
}

export function collectElements(
  plugins: readonly WhiteboardPlugin[]
): Map<WhiteboardElement["type"], ElementTypeContribution["render"]> {
  const map = new Map<
    WhiteboardElement["type"],
    ElementTypeContribution["render"]
  >()
  for (const p of sortPlugins(plugins)) {
    for (const el of p.elements ?? []) {
      map.set(el.type, el.render)
    }
  }
  return map
}

export { sortRailPlugins as sortToolPlugins }
