import { describe, expect, it, vi } from "vitest"
import { measureCaretInRoot } from "../../src/lib/caret-geometry"

describe("measureCaretInRoot", () => {
  it("returns null when there is no native selection", () => {
    const root = { contains: () => true } as unknown as HTMLElement
    vi.stubGlobal("window", {
      getSelection: () => null,
    })
    expect(measureCaretInRoot(root, "field-a")).toBe(null)
    vi.unstubAllGlobals()
  })

  it("returns null when selection anchor is outside root", () => {
    const root = { contains: () => false } as unknown as HTMLElement
    vi.stubGlobal("window", {
      getSelection: () => ({
        rangeCount: 1,
        anchorNode: {},
        anchorOffset: 0,
        focusOffset: 0,
        isCollapsed: true,
        getRangeAt: () => ({
          getClientRects: () => [],
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 0,
            height: 0,
          }),
        }),
      }),
    })
    expect(measureCaretInRoot(root, "field-a")).toBe(null)
    vi.unstubAllGlobals()
  })
})
