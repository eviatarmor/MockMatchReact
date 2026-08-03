import { describe, expect, it } from "vitest"
import {
  COLLAB_CARET_GLOW_ALPHA,
  COLLAB_SELECTION_OPACITY,
  collabCaretBoxShadow,
  collabSelectionBackground,
  collabSolidColor,
  parseHexColor,
} from "@/presence-colors"

describe("parseHexColor", () => {
  it("parses #RRGGBB", () => {
    expect(parseHexColor("#ff8800")).toEqual({ r: 255, g: 136, b: 0 })
    expect(parseHexColor("00ff00")).toEqual({ r: 0, g: 255, b: 0 })
  })

  it("parses #RGB shorthand", () => {
    expect(parseHexColor("#f80")).toEqual({ r: 255, g: 136, b: 0 })
  })

  it("returns null for invalid", () => {
    expect(parseHexColor("")).toBeNull()
    expect(parseHexColor("#gg0000")).toBeNull()
    expect(parseHexColor("#12345")).toBeNull()
    expect(parseHexColor("blue")).toBeNull()
  })
})

describe("collabSelectionBackground", () => {
  it("uses selection opacity for valid hex", () => {
    expect(collabSelectionBackground("#ff0000")).toBe(
      `rgba(255, 0, 0, ${COLLAB_SELECTION_OPACITY})`
    )
    expect(COLLAB_SELECTION_OPACITY).toBe(0.28)
  })

  it("falls back to raw color when unparsable", () => {
    expect(collabSelectionBackground("hsl(0 100% 50%)")).toBe(
      "hsl(0 100% 50%)"
    )
  })
})

describe("collabSolidColor", () => {
  it("returns color unchanged", () => {
    expect(collabSolidColor("#abc")).toBe("#abc")
  })
})

describe("collabCaretBoxShadow", () => {
  it("uses glow alpha for valid hex", () => {
    const shadow = collabCaretBoxShadow("#00ff00")
    expect(shadow).toContain(`rgba(0, 255, 0, ${COLLAB_CARET_GLOW_ALPHA})`)
    expect(COLLAB_CARET_GLOW_ALPHA).toBeCloseTo(0x33 / 0xff)
  })

  it("appends 33 hex for unparsable", () => {
    expect(collabCaretBoxShadow("red")).toBe("0 0 0 1px red33")
  })
})
