/**
 * Pure structural sheet transforms: insert/delete rows and columns.
 * Shifts cell keys, sizes, and formula refs (incl. absolute).
 */

import { cellKey, parseCellKey } from "./address"
import {
  adjustFormulaRefsForColDelete,
  adjustFormulaRefsForColInsert,
  adjustFormulaRefsForRowDelete,
  adjustFormulaRefsForRowInsert,
} from "./formula/structural-refs"
import { SHEET_MAX_COLS, SHEET_MAX_ROWS, type SpreadsheetCell, type SpreadsheetSheet } from "./types"

function clampCount(n: number): number {
  return Math.max(1, Math.floor(n))
}

function shiftSizeMap(
  map: Readonly<Record<string, number>> | undefined,
  at: number,
  count: number,
  mode: "insert" | "delete",
  maxIndex: number
): Record<string, number> | undefined {
  if (!map) return undefined
  const next: Record<string, number> = {}
  for (const [k, v] of Object.entries(map)) {
    const i = Number(k)
    if (!Number.isFinite(i)) continue
    if (mode === "insert") {
      const ni = i >= at ? i + count : i
      if (ni <= maxIndex) next[String(ni)] = v
    } else {
      if (i >= at && i < at + count) continue
      const ni = i >= at + count ? i - count : i
      if (ni >= 0) next[String(ni)] = v
    }
  }
  return Object.keys(next).length > 0 ? next : undefined
}

function withRaw(cell: SpreadsheetCell, raw: string): SpreadsheetCell {
  if (raw === cell.raw) return cell
  return { ...cell, raw }
}

export function insertRows(
  sheet: SpreadsheetSheet,
  at: number,
  count = 1
): SpreadsheetSheet {
  const n = clampCount(count)
  const insertAt = Math.max(0, Math.min(sheet.rowCount, Math.floor(at)))
  const rowCount = Math.min(SHEET_MAX_ROWS, sheet.rowCount + n)
  const cells: Record<string, SpreadsheetCell> = {}

  for (const [key, cell] of Object.entries(sheet.cells)) {
    const coord = parseCellKey(key)
    if (!coord) continue
    let { row, col } = coord
    if (row >= insertAt) row += n
    if (row >= SHEET_MAX_ROWS) continue
    const raw = adjustFormulaRefsForRowInsert(cell.raw, insertAt, n)
    cells[cellKey(row, col)] = withRaw(cell, raw)
  }

  return {
    ...sheet,
    cells,
    rowCount,
    rowHeights: shiftSizeMap(
      sheet.rowHeights,
      insertAt,
      n,
      "insert",
      SHEET_MAX_ROWS - 1
    ),
  }
}

export function deleteRows(
  sheet: SpreadsheetSheet,
  at: number,
  count = 1
): SpreadsheetSheet {
  const n = clampCount(count)
  const deleteAt = Math.max(0, Math.floor(at))
  if (deleteAt >= sheet.rowCount) return sheet
  const actual = Math.min(n, sheet.rowCount - deleteAt)
  if (actual <= 0) return sheet
  const rowCount = Math.max(1, sheet.rowCount - actual)
  const cells: Record<string, SpreadsheetCell> = {}

  for (const [key, cell] of Object.entries(sheet.cells)) {
    const coord = parseCellKey(key)
    if (!coord) continue
    let { row, col } = coord
    if (row >= deleteAt && row < deleteAt + actual) continue
    if (row >= deleteAt + actual) row -= actual
    const raw = adjustFormulaRefsForRowDelete(cell.raw, deleteAt, actual)
    cells[cellKey(row, col)] = withRaw(cell, raw)
  }

  return {
    ...sheet,
    cells,
    rowCount,
    rowHeights: shiftSizeMap(
      sheet.rowHeights,
      deleteAt,
      actual,
      "delete",
      SHEET_MAX_ROWS - 1
    ),
  }
}

export function insertCols(
  sheet: SpreadsheetSheet,
  at: number,
  count = 1
): SpreadsheetSheet {
  const n = clampCount(count)
  const insertAt = Math.max(0, Math.min(sheet.colCount, Math.floor(at)))
  const colCount = Math.min(SHEET_MAX_COLS, sheet.colCount + n)
  const cells: Record<string, SpreadsheetCell> = {}

  for (const [key, cell] of Object.entries(sheet.cells)) {
    const coord = parseCellKey(key)
    if (!coord) continue
    let { row, col } = coord
    if (col >= insertAt) col += n
    if (col >= SHEET_MAX_COLS) continue
    const raw = adjustFormulaRefsForColInsert(cell.raw, insertAt, n)
    cells[cellKey(row, col)] = withRaw(cell, raw)
  }

  return {
    ...sheet,
    cells,
    colCount,
    colWidths: shiftSizeMap(
      sheet.colWidths,
      insertAt,
      n,
      "insert",
      SHEET_MAX_COLS - 1
    ),
  }
}

export function deleteCols(
  sheet: SpreadsheetSheet,
  at: number,
  count = 1
): SpreadsheetSheet {
  const n = clampCount(count)
  const deleteAt = Math.max(0, Math.floor(at))
  if (deleteAt >= sheet.colCount) return sheet
  const actual = Math.min(n, sheet.colCount - deleteAt)
  if (actual <= 0) return sheet
  const colCount = Math.max(1, sheet.colCount - actual)
  const cells: Record<string, SpreadsheetCell> = {}

  for (const [key, cell] of Object.entries(sheet.cells)) {
    const coord = parseCellKey(key)
    if (!coord) continue
    let { row, col } = coord
    if (col >= deleteAt && col < deleteAt + actual) continue
    if (col >= deleteAt + actual) col -= actual
    const raw = adjustFormulaRefsForColDelete(cell.raw, deleteAt, actual)
    cells[cellKey(row, col)] = withRaw(cell, raw)
  }

  return {
    ...sheet,
    cells,
    colCount,
    colWidths: shiftSizeMap(
      sheet.colWidths,
      deleteAt,
      actual,
      "delete",
      SHEET_MAX_COLS - 1
    ),
  }
}
