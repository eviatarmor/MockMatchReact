import { getActiveSheet } from "../../document"
import { getColWidth, getRowHeight } from "../../layout"
import type {
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
} from "../../plugin-system"
import {
  MAX_COL_WIDTH,
  MAX_ROW_HEIGHT,
  MIN_COL_WIDTH,
  MIN_ROW_HEIGHT,
} from "../../types"

type ResizeDrag =
  | { kind: "col"; index: number; startX: number; startSize: number }
  | { kind: "row"; index: number; startY: number; startSize: number }

/** Column / row edge drag. */
export function createResizePlugin(): SpreadsheetPlugin {
  let drag: ResizeDrag | null = null

  return {
    id: "resize",
    order: 40,
    onPointerDown(e, ctx) {
      if (!ctx.canEdit()) return false
      const sheet = getActiveSheet(ctx.getDocument())
      if (!sheet) return false

      if (e.target === "col-resize" && e.col !== undefined) {
        e.preventDefault()
        e.stopPropagation()
        drag = {
          kind: "col",
          index: e.col,
          startX: e.clientX,
          startSize: getColWidth(sheet, e.col),
        }
        globalThis.document.body.style.cursor = "col-resize"
        globalThis.document.body.style.userSelect = "none"
        return true
      }

      if (e.target === "row-resize" && e.row !== undefined) {
        e.preventDefault()
        e.stopPropagation()
        drag = {
          kind: "row",
          index: e.row,
          startY: e.clientY,
          startSize: getRowHeight(sheet, e.row),
        }
        globalThis.document.body.style.cursor = "row-resize"
        globalThis.document.body.style.userSelect = "none"
        return true
      }

      return false
    },
    onPointerMove(e, ctx) {
      if (!drag) return false
      if (drag.kind === "col") {
        const next = Math.min(
          MAX_COL_WIDTH,
          Math.max(MIN_COL_WIDTH, drag.startSize + (e.clientX - drag.startX))
        )
        ctx.dispatch({ type: "setColWidth", col: drag.index, width: next })
        return true
      }
      const next = Math.min(
        MAX_ROW_HEIGHT,
        Math.max(MIN_ROW_HEIGHT, drag.startSize + (e.clientY - drag.startY))
      )
      ctx.dispatch({ type: "setRowHeight", row: drag.index, height: next })
      return true
    },
    onPointerUp(_e, _ctx: SpreadsheetPluginContext) {
      if (!drag) return false
      drag = null
      globalThis.document.body.style.cursor = ""
      globalThis.document.body.style.userSelect = ""
      return true
    },
  }
}
