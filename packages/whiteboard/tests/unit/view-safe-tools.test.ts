import { describe, expect, it } from "vitest"
import {
  isViewSafeWhiteboardTool,
  type WhiteboardTool,
} from "../../src/types"

const ALL_TOOLS: readonly WhiteboardTool[] = [
  "select",
  "pan",
  "pen",
  "highlighter",
  "smart",
  "eraser",
  "precisionEraser",
  "lasso",
  "sticky",
  "text",
  "shape",
  "connector",
]

describe("isViewSafeWhiteboardTool", () => {
  it("allows select and pan only", () => {
    expect(isViewSafeWhiteboardTool("select")).toBe(true)
    expect(isViewSafeWhiteboardTool("pan")).toBe(true)
  })

  it("rejects create/edit tools", () => {
    for (const tool of ALL_TOOLS) {
      if (tool === "select" || tool === "pan") continue
      expect(isViewSafeWhiteboardTool(tool)).toBe(false)
    }
  })
})
