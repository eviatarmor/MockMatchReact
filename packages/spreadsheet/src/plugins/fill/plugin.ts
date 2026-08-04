import { cellKey, normalizeRange } from "../../address"
import { getActiveSheet } from "../../document"
import { copyCellRawWithOffset } from "../../formula/adjust-refs"
import type {
  SpreadsheetPlugin,
  SpreadsheetPluginContext,
  SpreadsheetPointerDownEvent,
} from "../../plugin-system"
import type { CellCoord } from "../../types"
import { SHEET_MAX_COLS, SHEET_MAX_ROWS } from "../../types"

type FillSession = {
  sourceStart: CellCoord
  sourceEnd: CellCoord
  /** Cell where drag currently ends (inclusive). */
  focus: CellCoord
}

function selectionSource(ctx: SpreadsheetPluginContext): {
  start: CellCoord
  end: CellCoord
} {
  const sel = ctx.getSelection()
  if (sel.range) return normalizeRange(sel.range.start, sel.range.end)
  return { start: sel.active, end: sel.active }
}

function applyFill(
  ctx: SpreadsheetPluginContext,
  sourceStart: CellCoord,
  sourceEnd: CellCoord,
  fillStart: CellCoord,
  fillEnd: CellCoord
) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet || !ctx.canEdit()) return

  const src = normalizeRange(sourceStart, sourceEnd)
  const dst = normalizeRange(fillStart, fillEnd)
  const srcH = src.end.row - src.start.row + 1
  const srcW = src.end.col - src.start.col + 1

  const writes: { row: number; col: number; raw: string }[] = []

  for (let r = dst.start.row; r <= dst.end.row; r++) {
    for (let c = dst.start.col; c <= dst.end.col; c++) {
      // Skip cells already inside the source block
      if (
        r >= src.start.row &&
        r <= src.end.row &&
        c >= src.start.col &&
        c <= src.end.col
      ) {
        continue
      }
      const srcR = src.start.row + ((r - src.start.row) % srcH + srcH) % srcH
      const srcC = src.start.col + ((c - src.start.col) % srcW + srcW) % srcW
      const raw = sheet.cells[cellKey(srcR, srcC)]?.raw ?? ""
      const dRow = r - srcR
      const dCol = c - srcC
      writes.push({
        row: r,
        col: c,
        raw: copyCellRawWithOffset(raw, dRow, dCol),
      })
    }
  }

  if (writes.length === 0) return
  ctx.dispatch({ type: "setCells", cells: writes })
  ctx.setSelection(dst.end, dst.start)
}

/**
 * Fill handle (square on active selection) + double-click fill-down.
 * Relative formula refs adjust; $ locks stay fixed.
 */
export function createFillPlugin(): SpreadsheetPlugin {
  let session: FillSession | null = null

  return {
    id: "fill",
    order: 15,
    onPointerDown(e: SpreadsheetPointerDownEvent, ctx) {
      if (e.target !== "fill-handle") return false
      if (!ctx.canEdit()) return false
      e.preventDefault()
      e.stopPropagation()
      const { start, end } = selectionSource(ctx)
      session = {
        sourceStart: start,
        sourceEnd: end,
        focus: end,
      }
      return true
    },
    onPointerMove(e, ctx) {
      if (!session) return false
      if (e.row === undefined || e.col === undefined) return false
      const row = Math.max(0, Math.min(SHEET_MAX_ROWS - 1, e.row))
      const col = Math.max(0, Math.min(SHEET_MAX_COLS - 1, e.col))
      session = { ...session, focus: { row, col } }
      // Live preview: extend selection to cover source ∪ focus
      const a = session.sourceStart
      const b = session.sourceEnd
      const f = session.focus
      ctx.setSelection(
        { row: Math.min(a.row, b.row, f.row), col: Math.min(a.col, b.col, f.col) },
        { row: Math.max(a.row, b.row, f.row), col: Math.max(a.col, b.col, f.col) }
      )
      return true
    },
    onPointerUp(_e, ctx) {
      if (!session) return false
      const { sourceStart, sourceEnd, focus } = session
      session = null
      const src = normalizeRange(sourceStart, sourceEnd)
      const unionStart = {
        row: Math.min(src.start.row, focus.row),
        col: Math.min(src.start.col, focus.col),
      }
      const unionEnd = {
        row: Math.max(src.end.row, focus.row),
        col: Math.max(src.end.col, focus.col),
      }
      applyFill(ctx, sourceStart, sourceEnd, unionStart, unionEnd)
      return true
    },
    onKeyDown(e, ctx) {
      if (ctx.isEditing() || !ctx.canEdit()) return false
      // Ctrl+D fill down one row from selection
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault()
        const { start, end } = selectionSource(ctx)
        if (start.row === end.row) {
          // Single row: fill down into next row
          const nextRow = Math.min(SHEET_MAX_ROWS - 1, end.row + 1)
          applyFill(
            ctx,
            start,
            end,
            { row: start.row, col: start.col },
            { row: nextRow, col: end.col }
          )
        } else {
          // Multi-row: top row is source pattern? Excel Ctrl+D fills from top of selection into rest
          const top = start.row
          const sheet = getActiveSheet(ctx.getDocument())
          if (!sheet) return true
          const writes: { row: number; col: number; raw: string }[] = []
          for (let r = top + 1; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
              const raw = sheet.cells[cellKey(top, c)]?.raw ?? ""
              writes.push({
                row: r,
                col: c,
                raw: copyCellRawWithOffset(raw, r - top, 0),
              })
            }
          }
          if (writes.length) ctx.dispatch({ type: "setCells", cells: writes })
        }
        return true
      }
      // Ctrl+R fill right
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault()
        const { start, end } = selectionSource(ctx)
        const sheet = getActiveSheet(ctx.getDocument())
        if (!sheet) return true
        const left = start.col
        const writes: { row: number; col: number; raw: string }[] = []
        for (let r = start.row; r <= end.row; r++) {
          for (let c = left + 1; c <= end.col; c++) {
            const raw = sheet.cells[cellKey(r, left)]?.raw ?? ""
            writes.push({
              row: r,
              col: c,
              raw: copyCellRawWithOffset(raw, 0, c - left),
            })
          }
        }
        if (writes.length) ctx.dispatch({ type: "setCells", cells: writes })
        return true
      }
      return false
    },
  }
}

/** Double-click fill-handle: fill down while adjacent column has data. */
export function fillDownFromHandle(ctx: SpreadsheetPluginContext) {
  const sheet = getActiveSheet(ctx.getDocument())
  if (!sheet || !ctx.canEdit()) return
  const { start, end } = selectionSource(ctx)
  const src = normalizeRange(start, end)
  // Look at column left of selection (or right if col 0) for extent
  const probeCol =
    src.start.col > 0 ? src.start.col - 1 : Math.min(sheet.colCount - 1, src.end.col + 1)
  let lastRow = src.end.row
  for (let r = src.end.row + 1; r < sheet.rowCount; r++) {
    const adj = sheet.cells[cellKey(r, probeCol)]?.raw
    if (adj == null || adj === "") break
    lastRow = r
  }
  if (lastRow <= src.end.row) {
    // Fallback: fill 10 rows
    lastRow = Math.min(SHEET_MAX_ROWS - 1, src.end.row + 10)
  }
  applyFill(
    ctx,
    src.start,
    src.end,
    { row: src.start.row, col: src.start.col },
    { row: lastRow, col: src.end.col }
  )
}
