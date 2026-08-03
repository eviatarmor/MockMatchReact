import { describe, expect, it } from "vitest"
import type { ShapeElement } from "@/types"
import {
  applyResize,
  closestPort,
  elbowPolyline,
  elementPorts,
  FLOW_GRID,
  nearestPort,
  resizeHandlePoints,
  snapPoint,
  snapToGrid,
} from "@/lib/flowchart"

const box: ShapeElement = {
  id: "shape1",
  type: "shape",
  shape: "rect",
  x: 0,
  y: 0,
  w: 100,
  h: 40,
  z: 1,
  fill: "#fff",
  stroke: "#000",
}

describe("snapToGrid / snapPoint", () => {
  it("rounds to FLOW_GRID by default", () => {
    expect(FLOW_GRID).toBe(16)
    expect(snapToGrid(17)).toBe(16)
    // Math.round(24/16) === 2 → 32
    expect(snapToGrid(24)).toBe(32)
    expect(snapToGrid(25)).toBe(32)
    expect(snapToGrid(8)).toBe(16)
    expect(snapPoint(17, 25)).toEqual({ x: 16, y: 32 })
  })

  it("accepts custom grid", () => {
    expect(snapToGrid(7, 10)).toBe(10)
  })
})

describe("elementPorts / nearestPort / closestPort", () => {
  it("returns null for path / connector", () => {
    expect(
      elementPorts({
        id: "p",
        type: "path",
        points: [],
        z: 0,
        stroke: "#000",
        strokeWidth: 1,
      })
    ).toBeNull()
  })

  it("exposes N/S/E/W midpoints", () => {
    const ports = elementPorts(box)!
    expect(ports).toHaveLength(4)
    expect(ports.find((p) => p.anchor === "n")).toEqual({
      anchor: "n",
      x: 50,
      y: 0,
    })
    expect(ports.find((p) => p.anchor === "e")).toEqual({
      anchor: "e",
      x: 100,
      y: 20,
    })
  })

  it("nearestPort respects maxDist; closestPort always picks", () => {
    expect(nearestPort(box, 50, -5, 10)?.anchor).toBe("n")
    expect(nearestPort(box, 50, -100, 10)).toBeNull()
    expect(closestPort(box, 50, -100)?.anchor).toBe("n")
  })
})

describe("elbowPolyline", () => {
  it("direct line when axis-aligned", () => {
    expect(elbowPolyline(0, 0, 10, 0)).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ])
    expect(elbowPolyline(0, 0, 0, 10)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ])
  })

  it("uses horizontal-then-vertical mid bend otherwise", () => {
    expect(elbowPolyline(0, 0, 20, 10)).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 10 },
    ])
  })
})

describe("resizeHandlePoints / applyResize", () => {
  it("lists eight handles", () => {
    const pts = resizeHandlePoints(0, 0, 100, 40)
    expect(pts.map((p) => p.id)).toEqual([
      "nw",
      "n",
      "ne",
      "e",
      "se",
      "s",
      "sw",
      "w",
    ])
  })

  it("grows east/south and clamps min size", () => {
    const se = applyResize({ x: 0, y: 0, w: 100, h: 40 }, "se", 120, 80, 32)
    expect(se.w).toBeGreaterThanOrEqual(32)
    expect(se.h).toBeGreaterThanOrEqual(32)
    expect(se.w).toBeGreaterThan(100 - FLOW_GRID)

    const tiny = applyResize({ x: 0, y: 0, w: 100, h: 40 }, "e", 5, 20, 32)
    expect(tiny.w).toBeGreaterThanOrEqual(32)
  })

  it("moves west/north edges; snaps result to grid", () => {
    const w = applyResize({ x: 0, y: 0, w: 100, h: 40 }, "w", 16, 20, 32)
    // Right edge stays ~100 before snap; after snap both x and w snap to grid.
    expect(w.x).toBe(snapToGrid(16))
    expect(w.w).toBeGreaterThanOrEqual(32)
    expect(w.x % FLOW_GRID).toBe(0)
    expect(w.w % FLOW_GRID).toBe(0)

    const n = applyResize({ x: 0, y: 0, w: 100, h: 64 }, "n", 50, 16, 32)
    expect(n.y).toBe(snapToGrid(16))
    expect(n.h).toBeGreaterThanOrEqual(32)
    expect(n.y % FLOW_GRID).toBe(0)
  })
})
