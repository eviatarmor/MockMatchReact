import { describe, expect, it } from "vitest"
import {
  applyFormulaRefPick,
  findRefInsertSite,
  parseFormulaRefSpans,
  parseRefTokenRange,
  rangeToA1,
  refColorForCell,
} from "../../src/formula/ref-spans"

describe("parseRefTokenRange", () => {
  it("parses single cell and ranges", () => {
    expect(parseRefTokenRange("E2")).toEqual({
      start: { row: 1, col: 4 },
      end: { row: 1, col: 4 },
    })
    expect(parseRefTokenRange("A1:B2")).toEqual({
      start: { row: 0, col: 0 },
      end: { row: 1, col: 1 },
    })
    expect(parseRefTokenRange("$A$1:$C$3")).toEqual({
      start: { row: 0, col: 0 },
      end: { row: 2, col: 2 },
    })
  })
})

describe("parseFormulaRefSpans", () => {
  it("extracts colored same-sheet refs", () => {
    const spans = parseFormulaRefSpans("=SUM(E2)+A1")
    expect(spans).toHaveLength(2)
    expect(spans[0]!.start).toEqual({ row: 1, col: 4 })
    expect(spans[1]!.start).toEqual({ row: 0, col: 0 })
    expect(spans[0]!.color).toBeTruthy()
    expect(spans[0]!.color).not.toBe(spans[1]!.color)
  })

  it("skips cross-sheet refs after !", () => {
    const spans = parseFormulaRefSpans("=Sheet2!A1+B2")
    // B2 same-sheet; Sheet2!A1 skipped
    expect(spans).toHaveLength(1)
    expect(spans[0]!.start).toEqual({ row: 1, col: 1 })
  })

  it("maps cells inside ranges", () => {
    const spans = parseFormulaRefSpans("=A1:B2")
    expect(refColorForCell(spans, 0, 0)).toBeTruthy()
    expect(refColorForCell(spans, 1, 1)).toBeTruthy()
    expect(refColorForCell(spans, 2, 2)).toBeNull()
  })
})

describe("applyFormulaRefPick", () => {
  it("inserts A1 after =", () => {
    const r = applyFormulaRefPick(
      "=",
      1,
      { row: 1, col: 4 },
      { row: 1, col: 4 },
      null
    )
    expect(r.next).toBe("=E2")
    expect(r.caret).toBe(3)
  })

  it("replaces trailing ref on second pick", () => {
    const first = applyFormulaRefPick(
      "=",
      1,
      { row: 0, col: 0 },
      { row: 0, col: 0 },
      null
    )
    expect(first.next).toBe("=A1")
    // caret at end of A1 → replace site
    const second = applyFormulaRefPick(
      first.next,
      first.caret,
      { row: 1, col: 1 },
      { row: 1, col: 1 },
      null
    )
    expect(second.next).toBe("=B2")
  })

  it("extends to range during session drag", () => {
    const start = applyFormulaRefPick(
      "=SUM(",
      5,
      { row: 0, col: 0 },
      { row: 0, col: 0 },
      null
    )
    expect(start.next).toBe("=SUM(A1")
    const drag = applyFormulaRefPick(
      start.next,
      start.caret,
      start.session.anchor,
      { row: 2, col: 1 },
      start.session
    )
    expect(drag.next).toBe("=SUM(A1:B3")
  })

  it("appends after operator", () => {
    const r = applyFormulaRefPick(
      "=A1+",
      4,
      { row: 0, col: 1 },
      { row: 0, col: 1 },
      null
    )
    expect(r.next).toBe("=A1+B1")
  })
})

describe("findRefInsertSite / rangeToA1", () => {
  it("finds ref under caret", () => {
    expect(findRefInsertSite("=SUM(A1)", 6)).toEqual({ start: 5, end: 7 })
  })

  it("formats ranges", () => {
    expect(rangeToA1({ row: 0, col: 0 }, { row: 0, col: 0 })).toBe("A1")
    expect(rangeToA1({ row: 0, col: 0 }, { row: 1, col: 2 })).toBe("A1:C2")
  })
})
