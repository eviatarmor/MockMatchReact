import { normalizeRange } from "../../address"
import type {
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
} from "../../plugin-system"
import {
  SHEET_GROW_BUFFER_COLS,
  SHEET_GROW_BUFFER_ROWS,
  SHEET_MAX_COLS,
  SHEET_MAX_ROWS,
} from "../../types"
import { getActiveSheet } from "../../document"

function moveActive(
  ctx: SpreadsheetPluginContext,
  dRow: number,
  dCol: number,
  extend: boolean
) {
  const selection = ctx.getSelection()
  const next = {
    row: Math.max(
      0,
      Math.min(SHEET_MAX_ROWS - 1, selection.active.row + dRow)
    ),
    col: Math.max(
      0,
      Math.min(SHEET_MAX_COLS - 1, selection.active.col + dCol)
    ),
  }
  ctx.dispatch({
    type: "ensureBounds",
    minRows: next.row + 1 + SHEET_GROW_BUFFER_ROWS,
    minCols: next.col + 1 + SHEET_GROW_BUFFER_COLS,
  })
  if (extend) {
    const a = selection.range?.start ?? selection.active
    ctx.setSelection(next, a)
  } else {
    ctx.setSelection(next, null)
  }
  ctx.scrollCellIntoView?.(next)
}

function jump(
  ctx: SpreadsheetPluginContext,
  row: number,
  col: number,
  extend: boolean
) {
  const selection = ctx.getSelection()
  const next = {
    row: Math.max(0, Math.min(SHEET_MAX_ROWS - 1, row)),
    col: Math.max(0, Math.min(SHEET_MAX_COLS - 1, col)),
  }
  ctx.dispatch({
    type: "ensureBounds",
    minRows: next.row + 1 + SHEET_GROW_BUFFER_ROWS,
    minCols: next.col + 1 + SHEET_GROW_BUFFER_COLS,
  })
  if (extend) {
    const a = selection.range?.start ?? selection.active
    ctx.setSelection(next, a)
  } else {
    ctx.setSelection(next, null)
  }
  ctx.scrollCellIntoView?.(next)
}

/** Arrows, Tab, Delete, Home/End, Page, Ctrl+A when not editing. */
export function createKeyboardPlugin(): SpreadsheetPlugin {
  return {
    id: "keyboard",
    order: 20,
    onKeyDown(e, ctx) {
      if (ctx.isEditing()) return false

      const sheet = getActiveSheet(ctx.getDocument())
      const lastRow = Math.max(0, (sheet?.rowCount ?? 1) - 1)
      const lastCol = Math.max(0, (sheet?.colCount ?? 1) - 1)
      const mod = e.ctrlKey || e.metaKey
      const extend = e.shiftKey

      if (e.key === "ArrowUp") {
        e.preventDefault()
        if (mod) jump(ctx, 0, ctx.getSelection().active.col, extend)
        else moveActive(ctx, -1, 0, extend)
        return true
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        if (mod) jump(ctx, lastRow, ctx.getSelection().active.col, extend)
        else moveActive(ctx, 1, 0, extend)
        return true
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (mod) jump(ctx, ctx.getSelection().active.row, 0, extend)
        else moveActive(ctx, 0, -1, extend)
        return true
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        if (mod) jump(ctx, ctx.getSelection().active.row, lastCol, extend)
        else moveActive(ctx, 0, 1, extend)
        return true
      }
      if (e.key === "Home") {
        e.preventDefault()
        if (mod) jump(ctx, 0, 0, extend)
        else jump(ctx, ctx.getSelection().active.row, 0, extend)
        return true
      }
      if (e.key === "End") {
        e.preventDefault()
        if (mod) jump(ctx, lastRow, lastCol, extend)
        else jump(ctx, ctx.getSelection().active.row, lastCol, extend)
        return true
      }
      if (e.key === "PageUp") {
        e.preventDefault()
        moveActive(ctx, -20, 0, extend)
        return true
      }
      if (e.key === "PageDown") {
        e.preventDefault()
        moveActive(ctx, 20, 0, extend)
        return true
      }
      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault()
        ctx.setSelection(
          { row: 0, col: 0 },
          { row: lastRow, col: lastCol }
        )
        return true
      }
      if (e.key === "Tab") {
        e.preventDefault()
        moveActive(ctx, 0, e.shiftKey ? -1 : 1, false)
        return true
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!ctx.canEdit()) return false
        e.preventDefault()
        const sel = ctx.getSelection()
        const { start, end } = sel.range
          ? normalizeRange(sel.range.start, sel.range.end)
          : { start: sel.active, end: sel.active }
        const cells: { row: number; col: number; raw: string }[] = []
        for (let r = start.row; r <= end.row; r++) {
          for (let c = start.col; c <= end.col; c++) {
            cells.push({ row: r, col: c, raw: "" })
          }
        }
        if (cells.length === 1) {
          ctx.dispatch({
            type: "setCell",
            row: cells[0]!.row,
            col: cells[0]!.col,
            raw: "",
          })
        } else if (cells.length > 1) {
          ctx.dispatch({ type: "setCells", cells })
        }
        ctx.setFormulaDraft("")
        return true
      }
      return false
    },
  }
}

export { moveActive as keyboardMoveActive }
