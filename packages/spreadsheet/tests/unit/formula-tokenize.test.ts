import { describe, expect, it } from "vitest"
import {
  assignRefColors,
  tokenizeFormula,
} from "../../src/formula/tokenize"

describe("tokenizeFormula", () => {
  it("colors function and distinct refs", () => {
    const tokens = tokenizeFormula("=SUM(B1:B5,A1)")
    const kinds = tokens.map((t) => t.kind)
    expect(kinds).toContain("function")
    expect(kinds.filter((k) => k === "ref")).toHaveLength(2)

    const refs = tokens.filter((t) => t.kind === "ref")
    expect(refs[0]?.text.replace(/\s/g, "")).toMatch(/B1:B5/i)
    expect(refs[1]?.text).toMatch(/A1/i)

    const colors = assignRefColors(tokens)
    expect(colors.get(refs[0]!.refKey!)).toBeTruthy()
    expect(colors.get(refs[1]!.refKey!)).toBeTruthy()
    expect(colors.get(refs[0]!.refKey!)).not.toBe(colors.get(refs[1]!.refKey!))
  })

  it("reuses the same color for the same ref", () => {
    const tokens = tokenizeFormula("=A1+A1")
    const colors = assignRefColors(tokens)
    const refs = tokens.filter((t) => t.kind === "ref")
    expect(refs).toHaveLength(2)
    expect(colors.get(refs[0]!.refKey!)).toBe(colors.get(refs[1]!.refKey!))
  })

  it("treats non-formula as plain text", () => {
    const tokens = tokenizeFormula("hello")
    expect(tokens).toEqual([{ kind: "text", text: "hello" }])
  })
})
