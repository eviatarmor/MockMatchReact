import { describe, expect, it, vi } from "vitest"
import {
  scheduleTemplateCameraPan,
  templateContentCenter,
} from "../../src/lib/template-camera"

describe("templateContentCenter", () => {
  it("returns null for empty or non-box content", () => {
    expect(templateContentCenter([])).toBeNull()
    expect(
      templateContentCenter([
        {
          id: "p1",
          type: "path",
          points: [{ x: 0, y: 0 }],
          style: { color: "#000", width: 1 },
          z: 0,
        } as never,
      ])
    ).toBeNull()
  })

  it("centers on axis-aligned element bounds", () => {
    expect(
      templateContentCenter([
        {
          id: "s1",
          type: "shape",
          kind: "rect",
          x: 0,
          y: 0,
          w: 100,
          h: 50,
          z: 0,
        } as never,
        {
          id: "t1",
          type: "sticky",
          x: 100,
          y: 50,
          w: 100,
          h: 50,
          z: 1,
          text: "",
          color: "#fff",
        } as never,
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
      [
        {
          id: "s1",
          type: "shape",
          kind: "rect",
          x: 10,
          y: 20,
          w: 30,
          h: 40,
          z: 0,
        } as never,
      ],
      { resetView, centerOnBoardPoint }
    )
    expect(centerOnBoardPoint).toHaveBeenCalledWith(25, 40)
    expect(resetView).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
