/**
 * Axis layout helpers for variable row heights / column widths.
 */

import {
  DEFAULT_COL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  type SpreadsheetSheet,
} from "./types"

export type AxisLayout = {
  /** offsets[i] = start px of index i; offsets[count] = total size. */
  readonly offsets: readonly number[]
  readonly total: number
}

export function getColWidth(sheet: SpreadsheetSheet, col: number): number {
  const w = sheet.colWidths?.[String(col)]
  return typeof w === "number" && w > 0 ? w : DEFAULT_COL_WIDTH
}

export function getRowHeight(sheet: SpreadsheetSheet, row: number): number {
  const h = sheet.rowHeights?.[String(row)]
  return typeof h === "number" && h > 0 ? h : DEFAULT_ROW_HEIGHT
}

export function buildColLayout(sheet: SpreadsheetSheet): AxisLayout {
  return buildAxisLayout(sheet.colCount, (c) => getColWidth(sheet, c))
}

export function buildRowLayout(sheet: SpreadsheetSheet): AxisLayout {
  return buildAxisLayout(sheet.rowCount, (r) => getRowHeight(sheet, r))
}

function buildAxisLayout(
  count: number,
  sizeAt: (i: number) => number
): AxisLayout {
  const n = Math.max(0, count)
  const offsets = new Array<number>(n + 1)
  offsets[0] = 0
  for (let i = 0; i < n; i++) {
    offsets[i + 1] = offsets[i]! + sizeAt(i)
  }
  return { offsets, total: offsets[n] ?? 0 }
}

/** Largest index i with offsets[i] <= pos (clamped). */
export function findIndexAtOffset(
  offsets: readonly number[],
  pos: number
): number {
  if (offsets.length <= 1) return 0
  let lo = 0
  let hi = offsets.length - 2
  const p = Math.max(0, pos)
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (offsets[mid]! <= p) lo = mid
    else hi = mid - 1
  }
  return lo
}

/** Inclusive visible range with overscan. */
export function visibleRange(
  layout: AxisLayout,
  scroll: number,
  viewport: number,
  overscan: number
): { start: number; end: number } {
  const count = layout.offsets.length - 1
  if (count <= 0) return { start: 0, end: -1 }
  const start = Math.max(0, findIndexAtOffset(layout.offsets, scroll) - overscan)
  const endPos = scroll + viewport
  let end = start
  while (end < count - 1 && layout.offsets[end]! < endPos) {
    end += 1
  }
  end = Math.min(count - 1, end + overscan)
  return { start, end }
}
