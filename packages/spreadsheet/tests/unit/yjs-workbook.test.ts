import { describe, expect, it } from "vitest"
import * as Y from "yjs"
import { createEmptyWorkbook } from "../../src/document"
import {
  ensureWorkbookYDoc,
  materializeWorkbook,
  setCellInYDoc,
} from "../../src/collab/yjs-workbook"

describe("yjs workbook", () => {
  it("seeds and materializes cells", () => {
    const ydoc = new Y.Doc()
    const seed = createEmptyWorkbook({ sheetName: "Sheet1", rowCount: 10, colCount: 5 })
    ensureWorkbookYDoc(ydoc, seed)
    const sheetId = seed.sheets[0]!.id
    setCellInYDoc(ydoc, sheetId, 0, 0, "9")
    const doc = materializeWorkbook(ydoc)
    expect(doc.sheets[0]?.cells["0:0"]?.raw).toBe("9")
    expect(doc.sheets[0]?.name).toBe("Sheet1")
  })

  it("ensure is idempotent when sheets exist", () => {
    const ydoc = new Y.Doc()
    ensureWorkbookYDoc(ydoc, createEmptyWorkbook())
    const first = materializeWorkbook(ydoc)
    ensureWorkbookYDoc(ydoc, createEmptyWorkbook({ sheetName: "Other" }))
    const second = materializeWorkbook(ydoc)
    expect(second.sheets[0]?.name).toBe(first.sheets[0]?.name)
  })
})
