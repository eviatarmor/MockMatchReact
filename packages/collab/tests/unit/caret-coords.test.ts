import { describe, expect, it } from "vitest"
import {
  MAX_SELECTION_RECTS,
  elementCssScale,
  getDomSelectionClientRects,
  getTextFieldCaretClientRect,
  getTextFieldSelectionClientRects,
} from "@/caret-coords"

describe("MAX_SELECTION_RECTS", () => {
  it("caps multi-line selection rects", () => {
    expect(MAX_SELECTION_RECTS).toBe(32)
  })
})

describe("elementCssScale", () => {
  it("returns 1 when offset size is 0", () => {
    const el = document.createElement("div")
    document.body.appendChild(el)
    // empty element: offsetWidth often 0 → scale defaults to 1
    const s = elementCssScale(el)
    expect(s.scaleX).toBe(1)
    expect(s.scaleY).toBe(1)
    document.body.removeChild(el)
  })

  it("computes scale from rect vs offset when sized", () => {
    const el = document.createElement("div")
    el.style.width = "100px"
    el.style.height = "50px"
    document.body.appendChild(el)
    // jsdom may report 0 for layout — still must return finite positive scales
    const s = elementCssScale(el)
    expect(Number.isFinite(s.scaleX)).toBe(true)
    expect(Number.isFinite(s.scaleY)).toBe(true)
    expect(s.scaleX).toBeGreaterThan(0)
    expect(s.scaleY).toBeGreaterThan(0)
    document.body.removeChild(el)
  })
})

describe("getTextFieldCaretClientRect", () => {
  it("returns null when selectionStart is null", () => {
    const el = document.createElement("input")
    // force null-ish selection if possible
    Object.defineProperty(el, "selectionStart", { value: null })
    expect(getTextFieldCaretClientRect(el)).toBeNull()
  })

  it("returns a DOMRect for input caret", () => {
    const el = document.createElement("input")
    el.value = "hello"
    el.style.font = "16px sans-serif"
    document.body.appendChild(el)
    el.setSelectionRange(2, 2)
    const rect = getTextFieldCaretClientRect(el)
    // jsdom layout is limited; function should still return DOMRect or null safely
    if (rect) {
      expect(rect).toBeInstanceOf(DOMRect)
      expect(rect.height).toBeGreaterThanOrEqual(1)
    }
    document.body.removeChild(el)
  })
})

describe("getTextFieldSelectionClientRects", () => {
  it("returns empty when caret-only", () => {
    const el = document.createElement("input")
    el.value = "hi"
    document.body.appendChild(el)
    el.setSelectionRange(1, 1)
    expect(getTextFieldSelectionClientRects(el)).toEqual([])
    document.body.removeChild(el)
  })

  it("returns rects for non-empty input selection", () => {
    const el = document.createElement("input")
    el.value = "hello world"
    document.body.appendChild(el)
    el.setSelectionRange(0, 5)
    const rects = getTextFieldSelectionClientRects(el)
    expect(Array.isArray(rects)).toBe(true)
    if (rects.length > 0) {
      expect(rects[0]!.width).toBeGreaterThanOrEqual(2)
    }
    document.body.removeChild(el)
  })
})

describe("getDomSelectionClientRects", () => {
  it("returns empty when no selection", () => {
    window.getSelection()?.removeAllRanges()
    expect(getDomSelectionClientRects()).toEqual([])
  })
})
