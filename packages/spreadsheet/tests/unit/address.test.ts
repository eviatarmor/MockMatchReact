import { describe, expect, it } from "vitest"
import {
  cellKey,
  colToLetter,
  letterToCol,
  parseA1,
  toA1,
} from "../../src/address"

describe("address", () => {
  it("colToLetter / letterToCol round-trip", () => {
    expect(colToLetter(0)).toBe("A")
    expect(colToLetter(25)).toBe("Z")
    expect(colToLetter(26)).toBe("AA")
    expect(letterToCol("A")).toBe(0)
    expect(letterToCol("Z")).toBe(25)
    expect(letterToCol("AA")).toBe(26)
  })

  it("toA1 / parseA1", () => {
    expect(toA1(0, 0)).toBe("A1")
    expect(toA1(9, 2)).toBe("C10")
    expect(parseA1("B3")).toEqual({ row: 2, col: 1 })
    expect(parseA1("$A$1")).toEqual({ row: 0, col: 0 })
    expect(parseA1("nope")).toBeNull()
  })

  it("cellKey", () => {
    expect(cellKey(1, 2)).toBe("1:2")
  })
})
