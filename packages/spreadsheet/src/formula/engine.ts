import {
  HyperFormula,
  DetailedCellError,
  type SimpleCellAddress,
} from "hyperformula"
import { cellKey, parseCellKey } from "../address"
import type { DisplayCell, SpreadsheetDocument, SpreadsheetSheet } from "../types"

/** Build (or rebuild) a HyperFormula instance from a workbook document. */
export function createFormulaEngine(doc: SpreadsheetDocument): HyperFormula {
  const sheetNameMap: Record<string, string> = {}
  const sheetsContent: Record<string, (string | number | boolean | null)[][]> =
    {}

  for (const sheet of doc.sheets) {
    sheetNameMap[sheet.id] = sheet.name
    sheetsContent[sheet.name] = materializeSheetGrid(sheet)
  }

  const hf = HyperFormula.buildFromSheets(sheetsContent, {
    licenseKey: "gpl-v3",
    useColumnIndex: true,
  })

  // Ensure sheet order / names match; buildFromSheets uses object key order.
  return hf
}

function materializeSheetGrid(
  sheet: SpreadsheetSheet
): (string | number | boolean | null)[][] {
  const rows: (string | number | boolean | null)[][] = []
  for (let r = 0; r < sheet.rowCount; r++) {
    const row: (string | number | boolean | null)[] = []
    for (let c = 0; c < sheet.colCount; c++) {
      const raw = sheet.cells[cellKey(r, c)]?.raw
      row.push(raw === undefined || raw === "" ? null : raw)
    }
    rows.push(row)
  }
  // HyperFormula needs at least one row/col
  if (rows.length === 0) return [[null]]
  return rows
}

export function getDisplayCell(
  hf: HyperFormula,
  sheet: SpreadsheetSheet,
  row: number,
  col: number
): DisplayCell {
  const raw = sheet.cells[cellKey(row, col)]?.raw ?? ""
  const isFormula = raw.startsWith("=")
  if (!raw) {
    return { raw: "", display: "", isFormula: false, error: null }
  }

  const sheetId = hf.getSheetId(sheet.name)
  if (sheetId === undefined) {
    return {
      raw,
      display: raw,
      isFormula,
      error: isFormula ? "#REF!" : null,
    }
  }

  const addr: SimpleCellAddress = { sheet: sheetId, row, col }
  try {
    const value = hf.getCellValue(addr)
    if (value instanceof DetailedCellError) {
      return {
        raw,
        display: value.value,
        isFormula,
        error: value.type,
      }
    }
    if (value === null || value === undefined) {
      return { raw, display: isFormula ? "" : raw, isFormula, error: null }
    }
    if (typeof value === "number") {
      return {
        raw,
        display: formatNumber(value),
        isFormula,
        error: null,
      }
    }
    if (typeof value === "boolean") {
      return {
        raw,
        display: value ? "TRUE" : "FALSE",
        isFormula,
        error: null,
      }
    }
    return { raw, display: String(value), isFormula, error: null }
  } catch {
    return {
      raw,
      display: isFormula ? "#ERROR!" : raw,
      isFormula,
      error: "#ERROR!",
    }
  }
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n)
  // Prefer short display for integers / short floats
  if (Number.isInteger(n)) return String(n)
  const s = n.toPrecision(10)
  return String(Number(s))
}

/**
 * Apply a single cell raw update into HyperFormula without full rebuild.
 * Returns false if a full rebuild is recommended (new sheet bounds / missing sheet).
 */
export function applyCellToEngine(
  hf: HyperFormula,
  sheetName: string,
  row: number,
  col: number,
  raw: string
): boolean {
  const sheetId = hf.getSheetId(sheetName)
  if (sheetId === undefined) return false
  try {
    const content = raw === "" ? null : raw
    hf.setCellContents({ sheet: sheetId, row, col }, [[content]])
    return true
  } catch {
    return false
  }
}

/** Rebuild engine when sheets are added/renamed/reordered. */
export function rebuildEngine(doc: SpreadsheetDocument): HyperFormula {
  return createFormulaEngine(doc)
}

export function listSparseDisplay(
  hf: HyperFormula,
  sheet: SpreadsheetSheet,
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number
): Map<string, DisplayCell> {
  const out = new Map<string, DisplayCell>()
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      const d = getDisplayCell(hf, sheet, r, c)
      if (d.raw || d.display) {
        out.set(cellKey(r, c), d)
      }
    }
  }
  // Also include any sparse keys outside empty display that HF still tracks
  for (const key of Object.keys(sheet.cells)) {
    const coord = parseCellKey(key)
    if (!coord) continue
    if (
      coord.row < rowStart ||
      coord.row > rowEnd ||
      coord.col < colStart ||
      coord.col > colEnd
    ) {
      continue
    }
    if (!out.has(key)) {
      out.set(key, getDisplayCell(hf, sheet, coord.row, coord.col))
    }
  }
  return out
}
