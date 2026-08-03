import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  buildContentHash,
  buildSearchDocument,
  DEDUPE_HIGH,
  DEDUPE_LOW,
  localMaxCosine,
  normalizeQuestionText,
} from "@/modules/questions/dedupe.js"

describe("normalizeQuestionText", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeQuestionText("  Hello   WORLD  ")).toBe("hello world")
  })

  it("strips punctuation but keeps letters and numbers", () => {
    expect(normalizeQuestionText("What is O(n)? #1")).toBe("what is o n 1")
  })
})

describe("buildContentHash", () => {
  it("is stable for equivalent normalized title/body", () => {
    const a = buildContentHash({
      title: "Binary Search",
      body: "Implement binary search.",
      format: "code_run",
      language: "TypeScript",
    })
    const b = buildContentHash({
      title: "  BINARY search  ",
      body: "Implement binary search.",
      format: "code_run",
      language: "typescript",
    })
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it("differs when format or language changes", () => {
    const base = {
      title: "Two Sum",
      body: "Find pair",
      format: "code_run",
      language: "python",
    }
    expect(buildContentHash(base)).not.toBe(
      buildContentHash({ ...base, format: "mcq" })
    )
    expect(buildContentHash(base)).not.toBe(
      buildContentHash({ ...base, language: "java" })
    )
  })

  it("matches manual sha256 of normalized join", () => {
    const input = {
      title: "A",
      body: "B",
      format: "conversation",
      language: null as string | null,
    }
    const raw = [
      normalizeQuestionText(input.title),
      normalizeQuestionText(input.body),
      input.format,
      "",
    ].join("|")
    const expected = createHash("sha256").update(raw).digest("hex")
    expect(buildContentHash(input)).toBe(expected)
  })
})

describe("buildSearchDocument", () => {
  it("joins non-empty fields with newlines", () => {
    const doc = buildSearchDocument({
      title: "Design a cache",
      domain: "systemDesign",
      format: "conversation",
      language: null,
      body: "Talk through LRU.",
      tags: ["cache", "lru"],
    })
    expect(doc).toBe(
      ["Design a cache", "systemDesign", "conversation", "Talk through LRU.", "cache lru"].join(
        "\n"
      )
    )
  })

  it("omits empty optional fields", () => {
    const doc = buildSearchDocument({
      title: "Hello",
      domain: "coding",
      format: "mcq",
    })
    expect(doc).toBe("Hello\ncoding\nmcq")
  })
})

describe("localMaxCosine", () => {
  it("returns 0 for empty corpus", () => {
    expect(localMaxCosine([1, 0], [])).toBe(0)
  })

  it("returns 1 for identical unit vectors", () => {
    expect(localMaxCosine([1, 0, 0], [[1, 0, 0]])).toBeCloseTo(1, 5)
  })

  it("returns max across corpus", () => {
    const candidate = [1, 0]
    const max = localMaxCosine(candidate, [
      [0, 1],
      [0.8, 0.2],
      [0.1, 0.9],
    ])
    expect(max).toBeGreaterThan(0.5)
    expect(max).toBeLessThanOrEqual(1)
  })
})

describe("dedupe thresholds", () => {
  it("keeps high above low band", () => {
    expect(DEDUPE_HIGH).toBeGreaterThan(DEDUPE_LOW)
    expect(DEDUPE_HIGH).toBe(0.9)
    expect(DEDUPE_LOW).toBe(0.82)
  })
})
