import type { NumberFormatId } from "../../types"
import type { SpreadsheetPlugin } from "../../plugin-system"

/**
 * Number format shortcuts (Excel-adjacent):
 * - Ctrl+Shift+1 → number (2 decimals)
 * - Ctrl+Shift+4 → currency
 * - Ctrl+Shift+5 → percent
 * - Ctrl+Shift+` → general
 */
export function createFormatPlugin(): SpreadsheetPlugin {
  return {
    id: "format",
    order: 65,
    onKeyDown(e, ctx) {
      if (ctx.isEditing() || !ctx.canEdit()) return false
      const mod = e.ctrlKey || e.metaKey
      if (!mod || !e.shiftKey) return false

      let format: NumberFormatId | null = null
      // Digit keys may be e.code "Digit1" with e.key "!" when shift held
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
      const sel = ctx.getSelection()
      const start = sel.range?.start ?? sel.active
      const end = sel.range?.end ?? sel.active
      const r0 = Math.min(start.row, end.row)
      const r1 = Math.max(start.row, end.row)
      const c0 = Math.min(start.col, end.col)
      const c1 = Math.max(start.col, end.col)

      // One history step via sequential setCellFormat is N steps — batch as setCells
      // by re-reading raw and writing format. Use setCellFormat in a loop is N undos.
      // Prefer setCells with format field.
      const sheet = ctx.getDocument().sheets.find(
        (s) => s.id === ctx.getDocument().activeSheetId
      )
      if (!sheet) return true
      const cells: {
        row: number
        col: number
        raw: string
        format: NumberFormatId | null
      }[] = []
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const raw = sheet.cells[`${r}:${c}`]?.raw ?? ""
          cells.push({ row: r, col: c, raw, format })
        }
      }
      ctx.dispatch({ type: "setCells", cells })
      return true
    },
  }
}
