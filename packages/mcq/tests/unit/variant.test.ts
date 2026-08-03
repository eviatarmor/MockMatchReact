import { describe, expect, it } from "vitest"
import { variantOf } from "../../src/variant"

describe("variantOf", () => {
  it("defaults to single", () => {
    expect(
      variantOf({
        id: "1",
        title: "t",
        stem: "s",
        options: ["a"],
      })
    ).toBe("single")
  })

  it("returns explicit variant", () => {
    expect(
      variantOf({
        id: "1",
        title: "t",
        stem: "s",
        options: ["a", "b"],
        variant: "order",
      })
    ).toBe("order")
  })
})
