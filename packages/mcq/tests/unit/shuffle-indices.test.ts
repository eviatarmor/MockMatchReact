import { describe, expect, it } from "vitest"
import { shuffleIndices } from "../../src/shuffle-indices"

describe("shuffleIndices", () => {
  it("returns identity for n < 2", () => {
    expect(shuffleIndices(0)).toEqual([])
    expect(shuffleIndices(1)).toEqual([0])
  })

  it("returns a permutation of 0..n-1", () => {
    const n = 8
    const result = shuffleIndices(n, "seed-a")
    expect(result).toHaveLength(n)
    expect([...result].sort((a, b) => a - b)).toEqual(
      Array.from({ length: n }, (_, i) => i)
    )
  })

  it("is deterministic for the same seed", () => {
    expect(shuffleIndices(6, "fixed")).toEqual(shuffleIndices(6, "fixed"))
    expect(shuffleIndices(6, "a")).not.toEqual(shuffleIndices(6, "b"))
  })

  it("avoids identity permutation when n > 1", () => {
    for (let i = 0; i < 20; i++) {
      const arr = shuffleIndices(4, `seed-${i}`)
      const identity = arr.every((v, idx) => v === idx)
      expect(identity).toBe(false)
    }
  })
})
