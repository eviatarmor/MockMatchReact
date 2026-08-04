import { describe, expect, it } from "vitest"
import { createEmptySheet, setCellRaw } from "../../src/document"
import {
  deleteCols,
  deleteRows,
  insertCols,
  insertRows,
} from "../../src/structure"

describe("structure insert/delete", () => {
  it("insertRows shifts cells and formula refs", () => {
    let sheet = createEmptySheet("S", { rowCount: 10, colCount: 5 })
    sheet = setCellRaw(sheet, 0, 0, "top")
    sheet = setCellRaw(sheet, 2, 0, "below")
    sheet = setCellRaw(sheet, 0, 1, "=A3")
    const next = insertRows(sheet, 1, 1)
    expect(next.cells["0:0"]?.raw).toBe("top")
    expect(next.cells["3:0"]?.raw).toBe("below")
    expect(next.cells["1:0"]).toBeUndefined()
    // A3 → A4 after insert at row 1
    expect(next.cells["0:1"]?.raw).toBe("=A4")
    expect(next.rowCount).toBe(11)
  })

  it("deleteRows removes block and fixes refs", () => {
    let sheet = createEmptySheet("S", { rowCount: 10, colCount: 5 })
    sheet = setCellRaw(sheet, 1, 0, "gone")
    sheet = setCellRaw(sheet, 3, 0, "keep")
    sheet = setCellRaw(sheet, 0, 0, "=A2")
    const next = deleteRows(sheet, 1, 1)
    expect(next.cells["1:0"]).toBeUndefined()
    expect(next.cells["2:0"]?.raw).toBe("keep")
    expect(next.cells["0:0"]?.raw).toBe("=#REF!")
  })

  it("insertCols shifts horizontally", () => {
    let sheet = createEmptySheet("S", { rowCount: 5, colCount: 5 })
    sheet = setCellRaw(sheet, 0, 1, "B")
    sheet = setCellRaw(sheet, 0, 0, "=B1")
    const next = insertCols(sheet, 1, 1)
    expect(next.cells["0:2"]?.raw).toBe("B")
    expect(next.cells["0:0"]?.raw).toBe("=C1")
  })

  it("deleteCols shifts left", () => {
    let sheet = createEmptySheet("S", { rowCount: 5, colCount: 5 })
    sheet = setCellRaw(sheet, 0, 2, "C")
    const next = deleteCols(sheet, 1, 1)
    expect(next.cells["0:1"]?.raw).toBe("C")
  })
})
