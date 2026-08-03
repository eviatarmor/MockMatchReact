import { describe, expect, it } from "vitest"
import { tierFromScore } from "@/modules/jobs/fit/tier.js"

describe("tierFromScore", () => {
  it("maps strong tier at 80+", () => {
    expect(tierFromScore(80)).toBe("strong")
    expect(tierFromScore(100)).toBe("strong")
  })

  it("maps good tier at 60–79", () => {
    expect(tierFromScore(60)).toBe("good")
    expect(tierFromScore(79)).toBe("good")
  })

  it("maps fair tier at 40–59", () => {
    expect(tierFromScore(40)).toBe("fair")
    expect(tierFromScore(59)).toBe("fair")
  })

  it("maps weak tier below 40", () => {
    expect(tierFromScore(39)).toBe("weak")
    expect(tierFromScore(8)).toBe("weak")
    expect(tierFromScore(0)).toBe("weak")
  })
})
