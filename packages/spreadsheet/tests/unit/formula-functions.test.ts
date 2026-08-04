import { describe, expect, it } from "vitest"
import {
  getFormulaFunctionNames,
  getFormulaFunctionQuery,
  getFormulaFunctionSuggestions,
} from "../../src/formula/functions"

describe("formula functions catalog", () => {
  it("lists registered HyperFormula names including SUM", () => {
    const names = getFormulaFunctionNames()
    expect(names.length).toBeGreaterThan(50)
    expect(names).toContain("SUM")
    expect(names).toContain("IF")
  })

  it("builds mention suggestions that insert NAME(", () => {
    const sum = getFormulaFunctionSuggestions().find((s) => s.label === "SUM")
    expect(sum?.value).toBe("SUM(")
  })
})

describe("getFormulaFunctionQuery", () => {
  it("opens empty query right after =", () => {
    expect(getFormulaFunctionQuery("=", 1)).toEqual({
      start: 1,
      end: 1,
      query: "",
    })
  })

  it("captures partial function name after =", () => {
    expect(getFormulaFunctionQuery("=SU", 3)).toEqual({
      start: 1,
      end: 3,
      query: "SU",
    })
  })

  it("does not open empty query after function paren", () => {
    expect(getFormulaFunctionQuery("=SUM(", 5)).toBeNull()
  })

  it("opens after operator once a letter is typed", () => {
    expect(getFormulaFunctionQuery("=A1+AV", 6)).toEqual({
      start: 4,
      end: 6,
      query: "AV",
    })
  })

  it("does not open empty query after +", () => {
    expect(getFormulaFunctionQuery("=A1+", 4)).toBeNull()
  })

  it("returns null for plain text without =", () => {
    expect(getFormulaFunctionQuery("hello", 5)).toBeNull()
  })

  it("returns null for numeric token after =", () => {
    expect(getFormulaFunctionQuery("=12", 3)).toBeNull()
  })
})
