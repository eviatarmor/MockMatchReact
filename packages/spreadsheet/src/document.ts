import { cellKey } from "./address"
import {
  DEFAULT_COL_COUNT,
  DEFAULT_ROW_COUNT,
  type SpreadsheetCell,
  type SpreadsheetDocument,
  type SpreadsheetSheet,
} from "./types"

let sheetSeq = 0

export function newSheetId(): string {
  sheetSeq += 1
  return `sheet-${sheetSeq}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptySheet(
  name: string,
  opts?: { rowCount?: number; colCount?: number; id?: string }
): SpreadsheetSheet {
  return {
    id: opts?.id ?? newSheetId(),
    name,
    cells: {},
    rowCount: opts?.rowCount ?? DEFAULT_ROW_COUNT,
    colCount: opts?.colCount ?? DEFAULT_COL_COUNT,
  }
}

export function createEmptyWorkbook(
  opts?: { sheetName?: string; rowCount?: number; colCount?: number }
): SpreadsheetDocument {
  const sheet = createEmptySheet(opts?.sheetName ?? "Sheet1", {
    rowCount: opts?.rowCount,
    colCount: opts?.colCount,
  })
  return {
    version: 1,
    sheets: [sheet],
    activeSheetId: sheet.id,
  }
}

export function getActiveSheet(
  doc: SpreadsheetDocument
): SpreadsheetSheet | undefined {
  return doc.sheets.find((s) => s.id === doc.activeSheetId) ?? doc.sheets[0]
}

export function getCellRaw(
  sheet: SpreadsheetSheet,
  row: number,
  col: number
): string {
  return sheet.cells[cellKey(row, col)]?.raw ?? ""
}

export function setCellRaw(
  sheet: SpreadsheetSheet,
  row: number,
  col: number,
  raw: string
): SpreadsheetSheet {
  const key = cellKey(row, col)
  const nextCells = { ...sheet.cells }
  if (raw === "") {
    delete nextCells[key]
  } else {
    nextCells[key] = { raw } satisfies SpreadsheetCell
  }
  // Grow sheet bounds if writing past edge
  const rowCount = Math.max(sheet.rowCount, row + 1)
  const colCount = Math.max(sheet.colCount, col + 1)
  return { ...sheet, cells: nextCells, rowCount, colCount }
}

export function updateSheet(
  doc: SpreadsheetDocument,
  sheetId: string,
  updater: (sheet: SpreadsheetSheet) => SpreadsheetSheet
): SpreadsheetDocument {
  return {
    ...doc,
    sheets: doc.sheets.map((s) => (s.id === sheetId ? updater(s) : s)),
  }
}

export function cloneDocument(doc: SpreadsheetDocument): SpreadsheetDocument {
  return {
    version: 1,
    activeSheetId: doc.activeSheetId,
    sheets: doc.sheets.map((s) => ({
      ...s,
      cells: { ...s.cells },
    })),
  }
}
