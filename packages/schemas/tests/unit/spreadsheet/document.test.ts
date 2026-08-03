import { describe, expect, it } from "vitest"
import { spreadsheetDocumentSchema } from "@/spreadsheet/document.js"

describe("spreadsheetDocumentSchema", () => {
  it("accepts sparse multi-sheet workbook", () => {
    const doc = spreadsheetDocumentSchema.parse({
      version: 1,
      activeSheetId: "s1",
      sheets: [
        {
          id: "s1",
          name: "Sheet1",
          cells: { "0:0": { raw: "1" }, "0:1": { raw: "=A1+1" } },
          rowCount: 100,
          colCount: 26,
        },
      ],
    })
    expect(doc.sheets[0]?.cells["0:1"]?.raw).toBe("=A1+1")
  })

  it("rejects empty sheets", () => {
    expect(() =>
      spreadsheetDocumentSchema.parse({
        version: 1,
        activeSheetId: "s1",
        sheets: [],
      })
    ).toThrow()
  })
})
