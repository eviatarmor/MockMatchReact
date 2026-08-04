import { getActiveSheet } from "../../document"
import type { CellStyle, NumberFormatId } from "../../types"
import type { SpreadsheetPlugin } from "../../plugin-system"
import {
  applyStyleToSelection,
  selectionBounds,
} from "../selection-utils"

function applyFormat(
  ctx: Parameters<NonNullable<SpreadsheetPlugin["onKeyDown"]>>[1],
  format: NumberFormatId | null
) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet) return
  const b = selectionBounds(ctx)
  const cells: {
    row: number
    col: number
    raw: string
    format: NumberFormatId | null
  }[] = []
  for (let r = b.startRow; r <= b.endRow; r++) {
    for (let c = b.startCol; c <= b.endCol; c++) {
      const raw = sheet.cells[`${r}:${c}`]?.raw ?? ""
      cells.push({ row: r, col: c, raw, format })
    }
  }
  ctx.dispatch({ type: "setCells", cells })
}

function toggleFlag(
  ctx: Parameters<NonNullable<SpreadsheetPlugin["onKeyDown"]>>[1],
  flag: keyof Pick<CellStyle, "bold" | "italic" | "underline" | "wrap">
) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet) return
  const active = ctx.getSelection().active
  const prev = sheet.cells[`${active.row}:${active.col}`]?.style
  const on = !prev?.[flag]
  applyStyleToSelection(ctx, { [flag]: on })
}

/**
 * Number format + style shortcuts:
 * - Ctrl+Shift+1/4/5/` → number / currency / percent / general
 * - Ctrl+B / I / U → bold / italic / underline
 */
export function createFormatPlugin(): SpreadsheetPlugin {
  return {
    id: "format",
    order: 65,
    onKeyDown(e, ctx) {
      if (ctx.isEditing() || !ctx.canEdit()) return false
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return false

      const key = e.key.toLowerCase()
      if (!e.shiftKey && (key === "b" || key === "i" || key === "u")) {
        e.preventDefault()
        if (key === "b") toggleFlag(ctx, "bold")
        else if (key === "i") toggleFlag(ctx, "italic")
        else toggleFlag(ctx, "underline")
        return true
      }

      if (!e.shiftKey) return false

      let format: NumberFormatId | null = null
      if (e.code === "Digit1" || e.key === "!" || e.key === "1") {
        format = "number"
      } else if (e.code === "Digit4" || e.key === "$" || e.key === "4") {
        format = "currency"
      } else if (e.code === "Digit5" || e.key === "%" || e.key === "5") {
        format = "percent"
      } else if (e.code === "Backquote" || e.key === "~" || e.key === "`") {
        format = "general"
      } else {
        return false
      }

      e.preventDefault()
      applyFormat(ctx, format)
      return true
    },
  }
}

export { applyFormat as applyNumberFormatToSelection, toggleFlag as toggleStyleFlagOnSelection }
