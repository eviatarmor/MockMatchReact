import { getActiveSheet } from "../../document"
import type {
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
  SpreadsheetPointerDownEvent,
} from "../../plugin-system"

function selectFullColumn(ctx: SpreadsheetPluginContext, col: number) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet) return
  const lastRow = Math.max(0, sheet.rowCount - 1)
  ctx.setSelection({ row: 0, col }, { row: lastRow, col })
}

function selectFullRow(ctx: SpreadsheetPluginContext, row: number) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet) return
  const lastCol = Math.max(0, sheet.colCount - 1)
  ctx.setSelection({ row, col: 0 }, { row, col: lastCol })
}

/** Full columns from anchor col through clicked col (shift-extend). */
function selectColumnRange(
  ctx: SpreadsheetPluginContext,
  col: number,
  anchorCol: number
) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet) return
  const lastRow = Math.max(0, sheet.rowCount - 1)
  ctx.setSelection({ row: 0, col }, { row: lastRow, col: anchorCol })
}

/** Full rows from anchor row through clicked row (shift-extend). */
function selectRowRange(
  ctx: SpreadsheetPluginContext,
  row: number,
  anchorRow: number
) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet) return
  const lastCol = Math.max(0, sheet.colCount - 1)
  ctx.setSelection({ row, col: 0 }, { row: anchorRow, col: lastCol })
}

function selectAll(ctx: SpreadsheetPluginContext) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet) return
  const lastRow = Math.max(0, sheet.rowCount - 1)
  const lastCol = Math.max(0, sheet.colCount - 1)
  ctx.setSelection({ row: 0, col: 0 }, { row: lastRow, col: lastCol })
}

function endEditIfNeeded(ctx: SpreadsheetPluginContext) {
  if (!ctx.isEditing()) return
  ctx.commitActiveCell?.()
  ctx.setEditing(false)
}

/**
 * Anchor for shift-extend: prefer the far end of an existing range so
 * repeated Shift+header clicks keep expanding from the original edge.
 */
function rangeAnchor(ctx: SpreadsheetPluginContext): {
  row: number
  col: number
} {
  const sel = ctx.getSelection()
  if (!sel.range) return sel.active
  // Active is the "moving" corner; the opposite corner of the range is fixed.
  const { start, end } = sel.range
  return {
    row: sel.active.row === start.row ? end.row : start.row,
    col: sel.active.col === start.col ? end.col : start.col,
  }
}

/** Click / drag range, headers, corner select-all. Shift+header extends. */
export function createSelectionPlugin(): SpreadsheetPlugin {
  let dragAnchor: { row: number; col: number } | null = null

  return {
    id: "selection",
    order: 10,
    onPointerDown(e: SpreadsheetPointerDownEvent, ctx) {
      if (e.target === "col-resize" || e.target === "row-resize") return false

      if (e.target === "corner") {
        e.preventDefault()
        endEditIfNeeded(ctx)
        selectAll(ctx)
        dragAnchor = null
        return true
      }

      if (e.target === "col-header" && e.col !== undefined) {
        e.preventDefault()
        endEditIfNeeded(ctx)
        if (e.shiftKey) {
          const anchor = rangeAnchor(ctx)
          selectColumnRange(ctx, e.col, anchor.col)
        } else {
          selectFullColumn(ctx, e.col)
        }
        dragAnchor = null
        return true
      }

      if (e.target === "row-header" && e.row !== undefined) {
        e.preventDefault()
        endEditIfNeeded(ctx)
        if (e.shiftKey) {
          const anchor = rangeAnchor(ctx)
          selectRowRange(ctx, e.row, anchor.row)
        } else {
          selectFullRow(ctx, e.row)
        }
        dragAnchor = null
        return true
      }

      if (e.target === "cell" && e.row !== undefined && e.col !== undefined) {
        endEditIfNeeded(ctx)
        dragAnchor = { row: e.row, col: e.col }
        if (e.shiftKey) {
          const active = ctx.getSelection().active
          ctx.setSelection({ row: e.row, col: e.col }, active)
        } else {
          ctx.setSelection({ row: e.row, col: e.col }, null)
        }
        return true
      }

      return false
    },
    onPointerMove(e, ctx) {
      if (!dragAnchor) return false
      if (e.row === undefined || e.col === undefined) return false
      ctx.setSelection({ row: e.row, col: e.col }, dragAnchor)
      return true
    },
    onPointerUp() {
      if (!dragAnchor) return false
      dragAnchor = null
      return true
    },
  }
}
