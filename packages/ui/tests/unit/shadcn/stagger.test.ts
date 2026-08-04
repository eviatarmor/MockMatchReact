import { describe, expect, it } from "vitest"
import {
  STAGGER,
  STAGGER_CHILDREN_CLASS,
  staggerDelay,
  staggerListOptions,
  staggerTransition,
} from "@/shadcn/stagger"

describe("STAGGER", () => {
  it("exposes cascade defaults used by tables/lists", () => {
    expect(STAGGER.count).toBe(12)
    expect(STAGGER.delay).toBe(0.04)
    expect(STAGGER.duration).toBe(0.22)
    expect(STAGGER.distance).toBe(10)
  })
})

describe("STAGGER_CHILDREN_CLASS", () => {
  it("exports the host CSS class name", () => {
    expect(STAGGER_CHILDREN_CLASS).toBe("stagger-children")
  })
})

describe("staggerListOptions", () => {
  it("covers every item in a long list", () => {
    const { count, delay } = staggerListOptions(48)
    expect(count).toBe(48)
    expect(delay).toBeLessThanOrEqual(STAGGER.delay)
    expect((count - 1) * delay).toBeLessThanOrEqual(1 + 1e-9)
  })

  it("uses base delay for short lists", () => {
    const { count, delay } = staggerListOptions(5)
    expect(count).toBe(5)
    expect(delay).toBe(STAGGER.delay)
  })
})

describe("staggerDelay", () => {
  it("indexes within count get index * delay", () => {
    expect(staggerDelay(0)).toBe(0)
    expect(staggerDelay(1)).toBe(STAGGER.delay)
    expect(staggerDelay(3)).toBe(3 * STAGGER.delay)
  })

  it("indexes at/after count get 0", () => {
    expect(staggerDelay(STAGGER.count)).toBe(0)
    expect(staggerDelay(STAGGER.count + 5)).toBe(0)
  })

  it("respects custom count/delay", () => {
    expect(staggerDelay(2, { count: 2, delay: 0.1 })).toBe(0)
    expect(staggerDelay(1, { count: 5, delay: 0.1 })).toBe(0.1)
  })
})

describe("staggerTransition", () => {
  it("returns motion transition with shared ease + delay", () => {
    const t = staggerTransition(2)
    expect(t.duration).toBe(STAGGER.duration)
    expect(t.delay).toBe(2 * STAGGER.delay)
    expect(t.ease).toEqual(STAGGER.ease)
  })

  it("honors option overrides", () => {
    const t = staggerTransition(1, { delay: 0.2, duration: 0.5, count: 10 })
    expect(t.delay).toBe(0.2)
    expect(t.duration).toBe(0.5)
  })
})
