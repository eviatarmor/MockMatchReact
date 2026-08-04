import { describe, expect, it } from "vitest"
import * as Y from "yjs"
import {
  createWorkbookUndoManager,
  ensureWorkbookYDoc,
  materializeWorkbook,
  setCellInYDoc,
  setCellsInYDoc,
  SS_ORIGIN_LOCAL,
} from "../../src/collab/yjs-workbook"
import { createEmptyWorkbook } from "../../src/document"

describe("Y.UndoManager workbook", () => {
  it("undoes local cell edits and restores text", () => {
    const ydoc = new Y.Doc()
    const seed = createEmptyWorkbook({ rowCount: 5, colCount: 5 })
    ensureWorkbookYDoc(ydoc, seed)
    const sheetId = seed.sheets[0]!.id
    const um = createWorkbookUndoManager(ydoc)

    setCellInYDoc(ydoc, sheetId, 0, 0, "hello", { origin: SS_ORIGIN_LOCAL })
    um.stopCapturing()
    expect(materializeWorkbook(ydoc).sheets[0]?.cells["0:0"]?.raw).toBe(
      "hello"
    )
    expect(um.undoStack.length).toBeGreaterThan(0)

    um.undo()
    expect(
      materializeWorkbook(ydoc).sheets[0]?.cells["0:0"]?.raw
    ).toBeUndefined()

    um.redo()
    expect(materializeWorkbook(ydoc).sheets[0]?.cells["0:0"]?.raw).toBe(
      "hello"
    )
  })

  it("undo after multi-cell clear restores each cell's text", () => {
    const ydoc = new Y.Doc()
    const seed = createEmptyWorkbook({ rowCount: 5, colCount: 5 })
    ensureWorkbookYDoc(ydoc, seed)
    const sheetId = seed.sheets[0]!.id
    const um = createWorkbookUndoManager(ydoc)

    setCellInYDoc(ydoc, sheetId, 0, 0, "A1", { origin: SS_ORIGIN_LOCAL })
    um.stopCapturing()
    setCellInYDoc(ydoc, sheetId, 0, 1, "B1", { origin: SS_ORIGIN_LOCAL })
    um.stopCapturing()
    setCellInYDoc(ydoc, sheetId, 1, 0, "A2", { origin: SS_ORIGIN_LOCAL })
    um.stopCapturing()

    setCellsInYDoc(
      ydoc,
      sheetId,
      [
        { row: 0, col: 0, raw: "" },
        { row: 0, col: 1, raw: "" },
        { row: 1, col: 0, raw: "" },
      ],
      SS_ORIGIN_LOCAL
    )
    um.stopCapturing()
    expect(materializeWorkbook(ydoc).sheets[0]?.cells ?? {}).toEqual({})

    um.undo()
    const cells = materializeWorkbook(ydoc).sheets[0]?.cells ?? {}
    expect(cells["0:0"]?.raw).toBe("A1")
    expect(cells["0:1"]?.raw).toBe("B1")
    expect(cells["1:0"]?.raw).toBe("A2")
  })

  it("undo after overwriting cell restores previous text", () => {
    const ydoc = new Y.Doc()
    const seed = createEmptyWorkbook({ rowCount: 5, colCount: 5 })
    ensureWorkbookYDoc(ydoc, seed)
    const sheetId = seed.sheets[0]!.id
    const um = createWorkbookUndoManager(ydoc)

    setCellInYDoc(ydoc, sheetId, 0, 0, "first", { origin: SS_ORIGIN_LOCAL })
    um.stopCapturing()
    setCellInYDoc(ydoc, sheetId, 0, 0, "second", { origin: SS_ORIGIN_LOCAL })
    um.stopCapturing()

    expect(materializeWorkbook(ydoc).sheets[0]?.cells["0:0"]?.raw).toBe(
      "second"
    )
    um.undo()
    expect(materializeWorkbook(ydoc).sheets[0]?.cells["0:0"]?.raw).toBe(
      "first"
    )
  })
})
