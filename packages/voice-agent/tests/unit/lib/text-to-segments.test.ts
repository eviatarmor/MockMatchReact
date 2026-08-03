import { describe, expect, it } from "vitest"
import { textToSegments } from "@/lib/text-to-segments"

describe("textToSegments", () => {
  it("returns empty duration floor for blank", () => {
    const r = textToSegments("   ")
    expect(r.segments).toEqual([])
    expect(r.durationSec).toBe(0.4)
  })

  it("empty string same as blank", () => {
    expect(textToSegments("").durationSec).toBe(0.4)
  })

  it("splits words with timing", () => {
    const r = textToSegments("hello world", 2)
    expect(r.segments).toHaveLength(2)
    expect(r.segments[0]?.text).toBe("hello ")
    expect(r.segments[1]?.text).toBe("world")
    expect(r.durationSec).toBe(1)
    expect(r.segments[0]?.startSecond).toBe(0)
    expect(r.segments[0]?.endSecond).toBe(0.5)
    expect(r.segments[1]?.startSecond).toBe(0.5)
    expect(r.segments[1]?.endSecond).toBe(1)
  })

  it("collapses multi whitespace", () => {
    const r = textToSegments("a   b\t\tc", 1)
    expect(r.segments).toHaveLength(3)
    expect(r.durationSec).toBe(3)
  })

  it("single word has no trailing space", () => {
    const r = textToSegments("solo", 4)
    expect(r.segments).toHaveLength(1)
    expect(r.segments[0]?.text).toBe("solo")
    expect(r.durationSec).toBe(0.25)
  })

  it("default wordsPerSec is 3.2", () => {
    const r = textToSegments("one two three four")
    expect(r.segments).toHaveLength(4)
    expect(r.durationSec).toBeCloseTo(4 / 3.2)
  })
})
