import { describe, expect, it } from "vitest"
import { formatNumberValue } from "../../src/format/number-format"

describe("formatNumberValue", () => {
  it("general shortens floats", () => {
    expect(formatNumberValue(2, "general")).toBe("2")
  })

  it("number uses 2 decimals", () => {
    expect(formatNumberValue(1.2, "number")).toBe("1.20")
  })

  it("percent multiplies by 100", () => {
    expect(formatNumberValue(0.15, "percent")).toBe("15.00%")
  })

  it("currency uses USD", () => {
    expect(formatNumberValue(12.5, "currency")).toMatch(/\$12\.50/)
  })

  it("integer rounds", () => {
    expect(formatNumberValue(3.7, "integer")).toBe("4")
  })
})
