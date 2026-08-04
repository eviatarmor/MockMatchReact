import {
  HyperFormula,
  DetailedCellError,
  type SimpleCellAddress,
} from "hyperformula"
import { cellKey, parseCellKey } from "../address"
import { formatNumberValue } from "../format/number-format"
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
    // Large caps so setCellContents can expand into "infinite" grid area.
    maxRows: 10_000,
    maxColumns: 500,
  })

  // Ensure sheet order / names match; buildFromSheets uses object key order.
  return hf
}

/**
 * Materialize only the used bounding box (+1) so empty trailing rows/cols
 * from infinite scroll do not allocate a dense HF matrix.
 */
function materializeSheetGrid(
  sheet: SpreadsheetSheet
): (string | number | boolean | null)[][] {
  let maxR = 0
  let maxC = 0
  for (const key of Object.keys(sheet.cells)) {
    const parts = key.split(":")
    const r = Number(parts[0])
    const c = Number(parts[1])
    if (Number.isFinite(r)) maxR = Math.max(maxR, r + 1)
    if (Number.isFinite(c)) maxC = Math.max(maxC, c + 1)
  }
  // At least 1×1; prefer a small working area when empty
  const rowN = Math.max(1, maxR)
  const colN = Math.max(1, maxC)
  const rows: (string | number | boolean | null)[][] = []
  for (let r = 0; r < rowN; r++) {
    const row: (string | number | boolean | null)[] = []
    for (let c = 0; c < colN; c++) {
      const raw = sheet.cells[cellKey(r, c)]?.raw
      row.push(raw === undefined || raw === "" ? null : raw)
    }
    rows.push(row)
  }
  return rows
}

export function getDisplayCell(
  hf: HyperFormula,
  sheet: SpreadsheetSheet,
  row: number,
  col: number
): DisplayCell {
  const cell = sheet.cells[cellKey(row, col)]
  const raw = cell?.raw ?? ""
  const format = cell?.format
  const isFormula = raw.startsWith("=")
  if (!raw) {
    return { raw: "", display: "", isFormula: false, error: null, format }
  }

  const sheetId = hf.getSheetId(sheet.name)
  if (sheetId === undefined) {
    return {
      raw,
      display: raw,
      isFormula,
      error: isFormula ? "#REF!" : null,
      format,
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
        format,
      }
    }
    if (value === null || value === undefined) {
      return {
        raw,
        display: isFormula ? "" : raw,
        isFormula,
        error: null,
        format,
      }
    }
    if (typeof value === "number") {
      return {
        raw,
        display: formatNumberValue(value, format),
        isFormula,
        error: null,
        format,
      }
    }
    if (typeof value === "boolean") {
      return {
        raw,
        display: value ? "TRUE" : "FALSE",
        isFormula,
        error: null,
        format,
      }
    }
    // Numeric-looking plain text can still take format
    if (!isFormula && format && format !== "general") {
      const n = Number(value)
      if (Number.isFinite(n) && String(value).trim() !== "") {
        return {
          raw,
          display: formatNumberValue(n, format),
          isFormula,
          error: null,
          format,
        }
      }
    }
    return { raw, display: String(value), isFormula, error: null, format }
  } catch {
    return {
      raw,
      display: isFormula ? "#ERROR!" : raw,
      isFormula,
      error: "#ERROR!",
      format,
    }
  }
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
