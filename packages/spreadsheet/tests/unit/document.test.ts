import { describe, expect, it } from "vitest"
import {
  createEmptyWorkbook,
  ensureSheetDimensions,
  getActiveSheet,
  getCellRaw,
  setCellRaw,
  setColWidth,
  setRowHeight,
} from "../../src/document"
import { getColWidth, getRowHeight } from "../../src/layout"
import {
  DEFAULT_COL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  SHEET_MAX_COLS,
  SHEET_MAX_ROWS,
} from "../../src/types"

describe("document", () => {
  it("creates empty workbook with one sheet", () => {
    const doc = createEmptyWorkbook()
    expect(doc.version).toBe(1)
    expect(doc.sheets).toHaveLength(1)
    expect(doc.activeSheetId).toBe(doc.sheets[0]!.id)
  })

  it("stores sparse cells", () => {
    const doc = createEmptyWorkbook()
    const sheet = getActiveSheet(doc)!
    const next = setCellRaw(sheet, 2, 3, "x")
    expect(getCellRaw(next, 2, 3)).toBe("x")
    expect(getCellRaw(next, 0, 0)).toBe("")
    expect(Object.keys(next.cells)).toEqual(["2:3"])
  })

  it("grows bounds when writing past edge", () => {
    const doc = createEmptyWorkbook({ rowCount: 10, colCount: 5 })
    const sheet = getActiveSheet(doc)!
    const next = setCellRaw(sheet, 50, 30, "far")
    expect(next.rowCount).toBeGreaterThanOrEqual(51)
    expect(next.colCount).toBeGreaterThanOrEqual(31)
    expect(getCellRaw(next, 50, 30)).toBe("far")
  })

  it("ensureSheetDimensions expands without cells", () => {
    const doc = createEmptyWorkbook({ rowCount: 10, colCount: 5 })
    const sheet = getActiveSheet(doc)!
    const next = ensureSheetDimensions(sheet, 200, 40)
    expect(next.rowCount).toBe(200)
    expect(next.colCount).toBe(40)
    expect(Object.keys(next.cells)).toHaveLength(0)
  })

  it("ensureSheetDimensions respects max caps", () => {
    const doc = createEmptyWorkbook({ rowCount: 10, colCount: 5 })
    const sheet = getActiveSheet(doc)!
    const next = ensureSheetDimensions(sheet, SHEET_MAX_ROWS + 99, SHEET_MAX_COLS + 99)
    expect(next.rowCount).toBe(SHEET_MAX_ROWS)
    expect(next.colCount).toBe(SHEET_MAX_COLS)
  })

  it("stores col/row sizes sparsely", () => {
    const doc = createEmptyWorkbook()
    const sheet = getActiveSheet(doc)!
    const withCol = setColWidth(sheet, 2, 180)
    const withRow = setRowHeight(withCol, 5, 44)
    expect(getColWidth(withRow, 2)).toBe(180)
    expect(getColWidth(withRow, 0)).toBe(DEFAULT_COL_WIDTH)
    expect(getRowHeight(withRow, 5)).toBe(44)
    expect(getRowHeight(withRow, 0)).toBe(DEFAULT_ROW_HEIGHT)
  })
})
