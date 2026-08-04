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

/** Click / drag range, headers, corner select-all. */
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
        selectFullColumn(ctx, e.col)
        dragAnchor = null
        return true
      }

      if (e.target === "row-header" && e.row !== undefined) {
        e.preventDefault()
        endEditIfNeeded(ctx)
        selectFullRow(ctx, e.row)
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
