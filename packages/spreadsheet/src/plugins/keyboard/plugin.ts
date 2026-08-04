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

/** Arrows, Tab, Delete when not editing. */
export function createKeyboardPlugin(): SpreadsheetPlugin {
  return {
    id: "keyboard",
    order: 20,
    onKeyDown(e, ctx) {
      if (ctx.isEditing()) return false

      if (e.key === "ArrowUp") {
        e.preventDefault()
        moveActive(ctx, -1, 0, e.shiftKey)
        return true
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        moveActive(ctx, 1, 0, e.shiftKey)
        return true
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        moveActive(ctx, 0, -1, e.shiftKey)
        return true
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        moveActive(ctx, 0, 1, e.shiftKey)
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
        const { row, col } = ctx.getSelection().active
        ctx.dispatch({ type: "setCell", row, col, raw: "" })
        ctx.setFormulaDraft("")
        return true
      }
      return false
    },
  }
}

export { moveActive as keyboardMoveActive }
