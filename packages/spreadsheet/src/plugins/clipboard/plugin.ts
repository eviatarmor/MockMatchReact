import { cellKey, normalizeRange } from "../../address"
import { getActiveSheet } from "../../document"
import type { SpreadsheetPlugin } from "../../plugin-system"

function selectionBounds(ctx: {
  getSelection: () => {
    active: { row: number; col: number }
    range: {
      start: { row: number; col: number }
      end: { row: number; col: number }
    } | null
  }
}) {
  const sel = ctx.getSelection()
  if (sel.range) {
    return normalizeRange(sel.range.start, sel.range.end)
  }
  return {
    start: sel.active,
    end: sel.active,
  }
}

/** Ctrl/Cmd+C/V/X plain TSV when not editing. */
export function createClipboardPlugin(): SpreadsheetPlugin {
  return {
    id: "clipboard",
    order: 70,
    onKeyDown(e, ctx) {
      if (ctx.isEditing()) return false
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return false

      const key = e.key.toLowerCase()
      if (key !== "c" && key !== "x" && key !== "v") return false

      const sheet = getActiveSheet(ctx.getDocument())
      if (!sheet) return false
      const { start, end } = selectionBounds(ctx)

      if (key === "c" || key === "x") {
        e.preventDefault()
        const lines: string[] = []
        for (let r = start.row; r <= end.row; r++) {
          const cells: string[] = []
          for (let c = start.col; c <= end.col; c++) {
            cells.push(sheet.cells[cellKey(r, c)]?.raw ?? "")
          }
          lines.push(cells.join("\t"))
        }
        const text = lines.join("\n")
        void navigator.clipboard?.writeText(text).catch(() => {
          /* ignore — clipboard may be denied */
        })
        if (key === "x" && ctx.canEdit()) {
          for (let r = start.row; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
              ctx.dispatch({ type: "setCell", row: r, col: c, raw: "" })
            }
          }
          ctx.setFormulaDraft("")
        }
        return true
      }

      // paste
      if (!ctx.canEdit()) return false
      e.preventDefault()
      void (async () => {
        try {
          const text = await navigator.clipboard.readText()
          if (!text) return
          const rows = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
          const active = ctx.getSelection().active
          for (let ri = 0; ri < rows.length; ri++) {
            const cols = rows[ri]!.split("\t")
            for (let ci = 0; ci < cols.length; ci++) {
              ctx.dispatch({
                type: "setCell",
                row: active.row + ri,
                col: active.col + ci,
                raw: cols[ci] ?? "",
              })
            }
          }
          const last = rows[rows.length - 1]?.split("\t") ?? [""]
          ctx.setSelection(
            {
              row: active.row + rows.length - 1,
              col: active.col + last.length - 1,
            },
            active
          )
          ctx.setFormulaDraft(
            rows.length === 1 && last.length === 1 ? (last[0] ?? "") : ""
          )
        } catch {
          /* clipboard denied */
        }
      })()
      return true
    },
  }
}
