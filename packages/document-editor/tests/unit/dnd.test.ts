import { describe, expect, it } from "vitest"
import { createScaleModifier } from "@/dnd"

describe("createScaleModifier", () => {
  it("divides transform by scale", () => {
    const mod = createScaleModifier(2)
    const out = mod({
      transform: { x: 100, y: 50, scaleX: 1, scaleY: 1 },
      activatorEvent: null,
      active: null,
      activeNodeRect: null,
      draggingNodeRect: null,
      containerNodeRect: null,
      overlayNodeRect: null,
      scrollableAncestors: [],
      scrollableAncestorRects: [],
      windowRect: null,
      over: null,
    })
    expect(out.x).toBe(50)
    expect(out.y).toBe(25)
    expect(out.scaleX).toBe(1)
    expect(out.scaleY).toBe(1)
  })

  it("identity at scale 1", () => {
    const mod = createScaleModifier(1)
    const out = mod({
      transform: { x: 12, y: -4, scaleX: 1, scaleY: 1 },
      activatorEvent: null,
      active: null,
      activeNodeRect: null,
      draggingNodeRect: null,
      containerNodeRect: null,
      overlayNodeRect: null,
      scrollableAncestors: [],
      scrollableAncestorRects: [],
      windowRect: null,
      over: null,
    })
    expect(out.x).toBe(12)
    expect(out.y).toBe(-4)
  })

  it("handles fractional zoom", () => {
    const mod = createScaleModifier(0.5)
    const out = mod({
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      activatorEvent: null,
      active: null,
      activeNodeRect: null,
      draggingNodeRect: null,
      containerNodeRect: null,
      overlayNodeRect: null,
      scrollableAncestors: [],
      scrollableAncestorRects: [],
      windowRect: null,
      over: null,
    })
    expect(out.x).toBe(20)
    expect(out.y).toBe(40)
  })
})
