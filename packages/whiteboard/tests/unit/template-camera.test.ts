import { describe, expect, it, vi } from "vitest"
import {
  scheduleTemplateCameraPan,
  templateContentCenter,
} from "../../src/lib/template-camera"

describe("templateContentCenter", () => {
  it("returns null for empty or non-box content", () => {
    expect(templateContentCenter([])).toBeNull()
    expect(
      templateContentCenter([{ type: "path", x: 0, y: 0, w: 10, h: 10 }])
    ).toBeNull()
  })

  it("centers on axis-aligned element bounds", () => {
    expect(
      templateContentCenter([
        { type: "shape", x: 0, y: 0, w: 100, h: 50 },
        { type: "sticky", x: 100, y: 50, w: 100, h: 50 },
      ])
    ).toEqual({ x: 100, y: 50 })
  })
})

describe("scheduleTemplateCameraPan", () => {
  it("pans to content center after double rAF", async () => {
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        cb(0)
        return 0
      }
    )
    const resetView = vi.fn()
    const centerOnBoardPoint = vi.fn()
    scheduleTemplateCameraPan(
      [{ type: "shape", x: 10, y: 20, w: 30, h: 40 }],
      { resetView, centerOnBoardPoint }
    )
    expect(centerOnBoardPoint).toHaveBeenCalledWith(25, 40)
    expect(resetView).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
