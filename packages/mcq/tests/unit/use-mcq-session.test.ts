import { describe, expect, it } from "vitest"
import { variantOf } from "../../src/variant"
import { shuffleIndices } from "../../src/shuffle-indices"
import type { McqQuestion } from "../../src/types"

describe("mcq session helpers", () => {
  it("maps questions for shell", () => {
    const q: McqQuestion = {
      id: "a",
      title: "t",
      stem: "s",
      options: ["x", "y"],
      variant: "multi",
    }
    expect(variantOf(q)).toBe("multi")
    expect(shuffleIndices(q.options.length, q.id)).toHaveLength(2)
  })
})
