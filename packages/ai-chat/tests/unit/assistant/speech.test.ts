import { describe, expect, it } from "vitest"
import { appendTranscript } from "@/assistant/speech"

describe("appendTranscript", () => {
  it("returns current when next empty", () => {
    expect(appendTranscript("hello", "")).toBe("hello")
    expect(appendTranscript("hello", "   ")).toBe("hello")
  })

  it("returns next when current empty", () => {
    expect(appendTranscript("", "world")).toBe("world")
    expect(appendTranscript("  ", "world")).toBe("world")
  })

  it("joins with single space", () => {
    expect(appendTranscript("hello", "world")).toBe("hello world")
    expect(appendTranscript("hello  ", "  world")).toBe("hello world")
  })

  it("trims next piece only at edges", () => {
    expect(appendTranscript("a", "  b c  ")).toBe("a b c")
  })
})
