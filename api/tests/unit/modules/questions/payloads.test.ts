import { describe, expect, it } from "vitest"
import {
  normalizePagePayload,
  normalizeSpreadsheetPayload,
  sanitizeStarterHtml,
} from "@/modules/questions/payloads.js"

describe("normalizeSpreadsheetPayload", () => {
  it("uses body as prompt when payload empty", () => {
    const p = normalizeSpreadsheetPayload({
      title: "NPV case",
      body: "Build a 3-year cash flow model.",
      domain: "finance",
      difficulty: "medium",
      format: "spreadsheet",
    })
    expect(p.prompt).toContain("cash flow")
    expect(p.starterWorkbook).toBeUndefined()
  })

  it("keeps sparse starter cells and formulas", () => {
    const p = normalizeSpreadsheetPayload({
      title: "Unit economics",
      body: "Fill CAC and LTV.",
      domain: "product",
      difficulty: "hard",
      format: "spreadsheet",
      payload: {
        prompt: "Compute LTV/CAC.",
        starterWorkbook: {
          version: 1,
          activeSheetId: "s1",
          sheets: [
            {
              id: "s1",
              name: "Model",
              rowCount: 40,
              colCount: 10,
              cells: {
                "0:0": { raw: "Month" },
                "0:1": { raw: "Revenue" },
                "1:1": { raw: "100" },
                "2:1": { raw: "=B2*1.1" },
              },
            },
          ],
        },
      },
    })
    expect(p.prompt).toBe("Compute LTV/CAC.")
    expect(p.starterWorkbook?.sheets[0]?.cells["2:1"]?.raw).toBe("=B2*1.1")
    expect(p.starterWorkbook?.activeSheetId).toBe("s1")
  })

  it("drops invalid cell keys", () => {
    const p = normalizeSpreadsheetPayload({
      title: "t",
      body: "b",
      domain: "finance",
      difficulty: "easy",
      format: "spreadsheet",
      payload: {
        starterWorkbook: {
          sheets: [
            {
              id: "s1",
              name: "S",
              cells: {
                A1: { raw: "nope" },
                "0:0": { raw: "ok" },
              },
            },
          ],
        },
      },
    })
    expect(p.starterWorkbook?.sheets[0]?.cells).toEqual({
      "0:0": { raw: "ok" },
    })
  })
})

describe("normalizePagePayload", () => {
  it("sanitizes starterHtml", () => {
    const p = normalizePagePayload({
      title: "Memo",
      body: "Write a product memo.",
      domain: "product",
      difficulty: "medium",
      format: "page",
      payload: {
        starterHtml:
          '<h1>Outline</h1><script>alert(1)</script><p onclick="x()">Intro</p>',
      },
    })
    expect(p.starterHtml).toContain("<h1>Outline</h1>")
    expect(p.starterHtml).not.toContain("script")
    expect(p.starterHtml).not.toContain("onclick")
  })

  it("falls back prompt to body", () => {
    const p = normalizePagePayload({
      title: "Case",
      body: "Analyze the market.",
      domain: "consulting",
      difficulty: "hard",
      format: "page",
    })
    expect(p.prompt).toBe("Analyze the market.")
  })
})

describe("sanitizeStarterHtml", () => {
  it("strips style blocks", () => {
    expect(sanitizeStarterHtml("<style>x{}</style><p>hi</p>")).toBe("<p>hi</p>")
  })
})
