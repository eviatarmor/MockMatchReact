import type { SpreadsheetPluginContext } from "../plugin-system"

export function selectionBounds(ctx: SpreadsheetPluginContext): {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
} {
  const sel = ctx.getSelection()
  const a = sel.range?.start ?? sel.active
  const b = sel.range?.end ?? sel.active
  return {
    startRow: Math.min(a.row, b.row),
    startCol: Math.min(a.col, b.col),
    endRow: Math.max(a.row, b.row),
    endCol: Math.max(a.col, b.col),
  }
}

export function applyStyleToSelection(
  ctx: SpreadsheetPluginContext,
  style: import("../types").CellStyle | null
): void {
  const b = selectionBounds(ctx)
  ctx.dispatch({
    type: "setStyles",
    startRow: b.startRow,
    startCol: b.startCol,
    endRow: b.endRow,
    endCol: b.endCol,
    style,
  })
}
