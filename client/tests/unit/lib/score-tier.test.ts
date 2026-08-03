import { describe, expect, it } from "vitest"
import { scoreBand } from "@/lib/score-tier"

describe("scoreBand", () => {
  it("classifies strong/ok/weak", () => {
    expect(scoreBand(100)).toBe("strong")
    expect(scoreBand(85)).toBe("strong")
    expect(scoreBand(84)).toBe("ok")
    expect(scoreBand(70)).toBe("ok")
    expect(scoreBand(69)).toBe("weak")
    expect(scoreBand(0)).toBe("weak")
  })
})
