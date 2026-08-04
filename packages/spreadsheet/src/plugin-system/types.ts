import type { ReactNode } from "react"
import type { SpreadsheetCommand } from "../commands"
import type {
  CellCoord,
  DisplayCell,
  SpreadsheetDocument,
  SpreadsheetSelection,
  SpreadsheetShellLabels,
} from "../types"

// ─── Host context ───────────────────────────────────────────────

export type CellRect = {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export type SpreadsheetPointerTarget =
  | "cell"
  | "col-header"
  | "row-header"
  | "corner"
  | "col-resize"
  | "row-resize"
  | "fill-handle"

export type SpreadsheetPointerDownEvent = {
  readonly clientX: number
  readonly clientY: number
  readonly shiftKey: boolean
  readonly target: SpreadsheetPointerTarget
  readonly row?: number
  readonly col?: number
  readonly preventDefault: () => void
  readonly stopPropagation: () => void
}

export type SpreadsheetPointerMoveEvent = {
  readonly clientX: number
  readonly clientY: number
  readonly row?: number
  readonly col?: number
}

export type SpreadsheetPointerUpEvent = {
  readonly clientX: number
  readonly clientY: number
}

/** API every plugin receives from the host. */
export type SpreadsheetPluginContext = {
  readonly getDocument: () => SpreadsheetDocument
  readonly getSelection: () => SpreadsheetSelection
  readonly getFormulaDraft: () => string
  readonly isEditing: () => boolean
  readonly canEdit: () => boolean
  readonly getDisplay: (row: number, col: number) => DisplayCell
  readonly getLabels: () => SpreadsheetShellLabels
  readonly setSelection: (
    active: CellCoord,
    rangeEnd?: CellCoord | null
  ) => void
  readonly setFormulaDraft: (v: string) => void
  readonly setEditing: (editing: boolean) => void
  readonly dispatch: (command: SpreadsheetCommand) => void
  readonly scrollCellIntoView?: (coord: CellCoord) => void
  readonly getActiveCellRect?: () => CellRect | null
  /**
   * Commit formula bar / active edit to the active cell.
   * Convenience over setCell + draft sync.
   */
  readonly commitActiveCell?: () => void
  /** Caret in formula draft (formula bar or in-cell editor). */
  readonly getFormulaCaret?: () => number
  readonly setFormulaCaret?: (caret: number) => void
  /** Formula bar field focused — enables ref-pick without in-cell editor. */
  readonly isFormulaBarActive?: () => boolean
  readonly setFormulaBarActive?: (active: boolean) => void
}

export type SpreadsheetChromeSlot = "top" | "bottom" | "overlay"

// ─── Unified plugin ─────────────────────────────────────────────

/**
 * One plugin model for selection, keyboard, cell edit, chrome, clipboard…
 *
 * Contribute any subset of hooks (same idea as whiteboard WhiteboardPlugin).
 */
export type SpreadsheetPlugin = {
  readonly id: string
  /** Feature/hook pipeline order (lower first). Default 100. */
  readonly order?: number
  readonly setup?: (ctx: SpreadsheetPluginContext) => void | (() => void)
  readonly onKeyDown?: (
    e: KeyboardEvent,
    ctx: SpreadsheetPluginContext
  ) => boolean | void
  readonly renderChrome?: (
    ctx: SpreadsheetPluginContext,
    slot: SpreadsheetChromeSlot
  ) => ReactNode
  readonly renderCellEditor?: (
    ctx: SpreadsheetPluginContext,
    cellRect: CellRect
  ) => ReactNode
  readonly renderCellOverlay?: (
    ctx: SpreadsheetPluginContext,
    cell: { row: number; col: number; rect: CellRect }
  ) => ReactNode
  readonly onPointerDown?: (
    e: SpreadsheetPointerDownEvent,
    ctx: SpreadsheetPluginContext
  ) => boolean | void
  readonly onPointerMove?: (
    e: SpreadsheetPointerMoveEvent,
    ctx: SpreadsheetPluginContext
  ) => boolean | void
  readonly onPointerUp?: (
    e: SpreadsheetPointerUpEvent,
    ctx: SpreadsheetPluginContext
  ) => boolean | void
}

export function sortPlugins(
  plugins: readonly SpreadsheetPlugin[]
): SpreadsheetPlugin[] {
  return [...plugins].sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
}

export function collectChrome(
  plugins: readonly SpreadsheetPlugin[],
  ctx: SpreadsheetPluginContext,
  slot: SpreadsheetChromeSlot
): ReactNode[] {
  const out: ReactNode[] = []
  for (const p of sortPlugins(plugins)) {
    const node = p.renderChrome?.(ctx, slot)
    if (node != null && node !== false) out.push(node)
  }
  return out
}
