import { describe, expect, it } from "vitest"
import { cosineSimilarity } from "@/lib/embeddings.js"

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 8)
    expect(cosineSimilarity([3, 4], [3, 4])).toBeCloseTo(1, 8)
  })

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 8)
  })

  it("returns -1 for opposite direction", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 8)
  })

  it("returns 0 for empty or length-mismatched inputs", () => {
    expect(cosineSimilarity([], [])).toBe(0)
    expect(cosineSimilarity([1, 2], [1])).toBe(0)
  })

  it("returns 0 when either vector is zero", () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0)
    expect(cosineSimilarity([1, 2], [0, 0])).toBe(0)
  })
})
