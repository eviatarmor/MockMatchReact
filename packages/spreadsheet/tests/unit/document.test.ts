import { describe, expect, it } from "vitest"
import {
  createEmptyWorkbook,
  getActiveSheet,
  getCellRaw,
  setCellRaw,
} from "../../src/document"

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
})
