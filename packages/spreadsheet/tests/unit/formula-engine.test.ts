import { describe, expect, it } from "vitest"
import { createEmptyWorkbook, setCellRaw, updateSheet } from "../../src/document"
import {
  createFormulaEngine,
  getDisplayCell,
} from "../../src/formula/engine"

describe("formula engine", () => {
  it("evaluates arithmetic formulas", () => {
    let doc = createEmptyWorkbook({ rowCount: 10, colCount: 10 })
    const sheet = doc.sheets[0]!
    let next = setCellRaw(sheet, 0, 0, "10")
    next = setCellRaw(next, 0, 1, "5")
    next = setCellRaw(next, 0, 2, "=A1+B1")
    doc = updateSheet(doc, sheet.id, () => next)

    const hf = createFormulaEngine(doc)
    const active = doc.sheets[0]!
    expect(getDisplayCell(hf, active, 0, 2).display).toBe("15")
    hf.destroy()
  })

  it("evaluates SUM over a range", () => {
    let doc = createEmptyWorkbook({ rowCount: 10, colCount: 5 })
    const sheet = doc.sheets[0]!
    let next = setCellRaw(sheet, 0, 0, "1")
    next = setCellRaw(next, 1, 0, "2")
    next = setCellRaw(next, 2, 0, "3")
    next = setCellRaw(next, 3, 0, "=SUM(A1:A3)")
    doc = updateSheet(doc, sheet.id, () => next)

    const hf = createFormulaEngine(doc)
    expect(getDisplayCell(hf, doc.sheets[0]!, 3, 0).display).toBe("6")
    hf.destroy()
  })

  it("shows literals as-is", () => {
    let doc = createEmptyWorkbook()
    const sheet = doc.sheets[0]!
    doc = updateSheet(doc, sheet.id, (s) => setCellRaw(s, 0, 0, "hello"))
    const hf = createFormulaEngine(doc)
    expect(getDisplayCell(hf, doc.sheets[0]!, 0, 0).display).toBe("hello")
    hf.destroy()
  })
})
