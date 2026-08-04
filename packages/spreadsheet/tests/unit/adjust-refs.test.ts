import { describe, expect, it } from "vitest"
import {
  adjustFormulaRefs,
  copyCellRawWithOffset,
} from "../../src/formula/adjust-refs"

describe("adjustFormulaRefs", () => {
  it("shifts relative refs", () => {
    expect(adjustFormulaRefs("=A1+B2", 1, 0)).toBe("=A2+B3")
    expect(adjustFormulaRefs("=A1", 0, 1)).toBe("=B1")
  })

  it("keeps absolute locks", () => {
    expect(adjustFormulaRefs("=$A$1+A1", 2, 1)).toBe("=$A$1+B3")
    expect(adjustFormulaRefs("=$A1+A$1", 1, 1)).toBe("=$A2+B$1")
  })

  it("ignores refs inside strings", () => {
    expect(adjustFormulaRefs('="A1"&A1', 1, 0)).toBe('="A1"&A2')
  })

  it("leaves non-formulas alone", () => {
    expect(adjustFormulaRefs("hello", 1, 1)).toBe("hello")
  })
})

describe("copyCellRawWithOffset", () => {
  it("copies formula with offset", () => {
    expect(copyCellRawWithOffset("=SUM(A1:A3)", 1, 0)).toBe("=SUM(A2:A4)")
  })
})
