import { cellKey, normalizeRange } from "../../address"
import { getActiveSheet } from "../../document"
import type { SpreadsheetPlugin } from "../../plugin-system"

/** In-memory clipboard for paste-special (values vs formulas). */
type ClipCell = { raw: string; display: string }
let memoryClip: ClipCell[][] | null = null

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

function captureClip(
  ctx: Parameters<NonNullable<SpreadsheetPlugin["onKeyDown"]>>[1],
  start: { row: number; col: number },
  end: { row: number; col: number }
): { tsv: string; grid: ClipCell[][] } {
  const sheet = getActiveSheet(ctx.getDocument())!
  const grid: ClipCell[][] = []
  const lines: string[] = []
  for (let r = start.row; r <= end.row; r++) {
    const rowCells: ClipCell[] = []
    const raws: string[] = []
    for (let c = start.col; c <= end.col; c++) {
      const raw = sheet.cells[cellKey(r, c)]?.raw ?? ""
      const display = ctx.getDisplay(r, c).display
      rowCells.push({ raw, display })
      raws.push(raw)
    }
    grid.push(rowCells)
    lines.push(raws.join("\t"))
  }
  return { tsv: lines.join("\n"), grid }
}

function pasteGrid(
  ctx: Parameters<NonNullable<SpreadsheetPlugin["onKeyDown"]>>[1],
  grid: ClipCell[][],
  mode: "formulas" | "values"
) {
  if (!ctx.canEdit() || grid.length === 0) return
  const active = ctx.getSelection().active
  const writes: { row: number; col: number; raw: string }[] = []
  for (let ri = 0; ri < grid.length; ri++) {
    const row = grid[ri]!
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci]!
      writes.push({
        row: active.row + ri,
        col: active.col + ci,
        raw: mode === "values" ? cell.display : cell.raw,
      })
    }
  }
  ctx.dispatch({ type: "setCells", cells: writes })
  const lastR = active.row + grid.length - 1
  const lastC = active.col + (grid[0]?.length ?? 1) - 1
  ctx.setSelection({ row: lastR, col: lastC }, active)
  ctx.setFormulaDraft(
    grid.length === 1 && (grid[0]?.length ?? 0) === 1
      ? mode === "values"
        ? (grid[0]![0]!.display)
        : grid[0]![0]!.raw
      : ""
  )
}

function pasteTsvAsFormulas(
  ctx: Parameters<NonNullable<SpreadsheetPlugin["onKeyDown"]>>[1],
  text: string
) {
  const rows = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
  const active = ctx.getSelection().active
  const writes: { row: number; col: number; raw: string }[] = []
  for (let ri = 0; ri < rows.length; ri++) {
    const cols = rows[ri]!.split("\t")
    for (let ci = 0; ci < cols.length; ci++) {
      writes.push({
        row: active.row + ri,
        col: active.col + ci,
        raw: cols[ci] ?? "",
      })
    }
  }
  if (writes.length === 0) return
  ctx.dispatch({ type: "setCells", cells: writes })
  const last = rows[rows.length - 1]?.split("\t") ?? [""]
  ctx.setSelection(
    {
      row: active.row + rows.length - 1,
      col: active.col + last.length - 1,
    },
    active
  )
}

/**
 * Copy / cut / paste (formulas) + Ctrl+Shift+V paste values.
 * Multi-cell writes are one undo step via `setCells`.
 */
export function createClipboardPlugin(): SpreadsheetPlugin {
  return {
    id: "clipboard",
    order: 70,
    onKeyDown(e, ctx) {
      if (ctx.isEditing()) return false
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return false

      const key = e.key.toLowerCase()
      // Paste values: Ctrl+Shift+V
      if (key === "v" && e.shiftKey) {
        if (!ctx.canEdit()) return false
        e.preventDefault()
        if (memoryClip) {
          pasteGrid(ctx, memoryClip, "values")
          return true
        }
        void (async () => {
          try {
            const text = await navigator.clipboard.readText()
            if (!text) return
            // System clipboard has no separate display — paste as plain text
            pasteTsvAsFormulas(ctx, text)
          } catch {
            /* denied */
          }
        })()
        return true
      }

      if (key !== "c" && key !== "x" && key !== "v") return false

      const sheet = getActiveSheet(ctx.getDocument())
      if (!sheet) return false
      const { start, end } = selectionBounds(ctx)

      if (key === "c" || key === "x") {
        e.preventDefault()
        const { tsv, grid } = captureClip(ctx, start, end)
        memoryClip = grid
        void navigator.clipboard?.writeText(tsv).catch(() => {
          /* ignore */
        })
        if (key === "x" && ctx.canEdit()) {
          const writes: { row: number; col: number; raw: string }[] = []
          for (let r = start.row; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
              writes.push({ row: r, col: c, raw: "" })
            }
          }
          ctx.dispatch({ type: "setCells", cells: writes })
          ctx.setFormulaDraft("")
        }
        return true
      }

      // paste formulas
      if (!ctx.canEdit()) return false
      e.preventDefault()
      if (memoryClip) {
        pasteGrid(ctx, memoryClip, "formulas")
        return true
      }
      void (async () => {
        try {
          const text = await navigator.clipboard.readText()
          if (!text) return
          pasteTsvAsFormulas(ctx, text)
        } catch {
          /* denied */
        }
      })()
      return true
    },
  }
}
