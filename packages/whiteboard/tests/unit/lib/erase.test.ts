import { describe, expect, it } from "vitest"
import type { PathElement, WhiteboardDocument } from "@/types"
import {
  erasePathPoints,
  eraseWholeStrokesAt,
  pathHitsBrush,
  precisionEraseAt,
} from "@/lib/erase"

function path(
  id: string,
  points: { x: number; y: number }[],
  strokeWidth = 2
): PathElement {
  return {
    id,
    type: "path",
    points,
    z: 1,
    stroke: "#000",
    strokeWidth,
  }
}

describe("pathHitsBrush", () => {
  it("false for empty path", () => {
    expect(pathHitsBrush(path("p", []), { x: 0, y: 0 }, 5)).toBe(false)
  })

  it("hits single point within radius + half stroke", () => {
    const el = path("p", [{ x: 0, y: 0 }], 2)
    expect(pathHitsBrush(el, { x: 0, y: 0 }, 1)).toBe(true)
    expect(pathHitsBrush(el, { x: 10, y: 0 }, 1)).toBe(false)
  })

  it("hits when brush near a segment", () => {
    const el = path("p", [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ])
    expect(pathHitsBrush(el, { x: 50, y: 2 }, 5)).toBe(true)
    expect(pathHitsBrush(el, { x: 50, y: 50 }, 5)).toBe(false)
  })
})

describe("erasePathPoints", () => {
  it("returns empty for empty path", () => {
    expect(erasePathPoints(path("p", []), { x: 0, y: 0 }, 5)).toEqual([])
  })

  it("splits path into fragments around erased region", () => {
    // Wide spacing so a small brush leaves ≥2 points on each side.
    const el = path(
      "p",
      [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 40, y: 0 },
        { x: 60, y: 0 },
        { x: 80, y: 0 },
        { x: 100, y: 0 },
      ],
      0
    )
    const frags = erasePathPoints(el, { x: 50, y: 0 }, 8)
    expect(frags.length).toBeGreaterThanOrEqual(1)
    for (const f of frags) {
      expect(f.points.length).toBeGreaterThanOrEqual(2)
      expect(f.stroke).toBe(el.stroke)
    }
    const allX = frags.flatMap((f) => f.points.map((p) => p.x))
    // Points near x=40/60 should be gone; ends may remain.
    expect(allX).not.toContain(40)
    expect(allX).not.toContain(60)
    expect(allX.some((x) => x <= 20 || x >= 80)).toBe(true)
  })

  it("can erase entire short path (no fragments)", () => {
    const el = path("p", [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
    ])
    expect(erasePathPoints(el, { x: 5, y: 0 }, 20)).toEqual([])
  })
})

describe("eraseWholeStrokesAt", () => {
  it("removes only hit paths", () => {
    const hit = path("hit", [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ])
    const miss = path("miss", [
      { x: 100, y: 100 },
      { x: 110, y: 100 },
    ])
    const sticky = {
      id: "s1",
      type: "sticky" as const,
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      z: 0,
      color: "#fff",
      text: "hi",
    }
    const doc: WhiteboardDocument = {
      version: 1,
      elements: { hit, miss, s1: sticky },
    }
    const { next, removedIds } = eraseWholeStrokesAt(doc, { x: 5, y: 0 }, 4)
    expect(removedIds).toEqual(["hit"])
    expect(next.elements.hit).toBeUndefined()
    expect(next.elements.miss).toBeDefined()
    expect(next.elements.s1).toBeDefined()
  })
})

describe("precisionEraseAt", () => {
  it("replaces hit path with re-id fragments; keeps non-paths", () => {
    let n = 0
    const newId = () => `f${++n}`
    // Enough points on each side so a small mid brush leaves two fragments.
    const el = path(
      "p1",
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
        { x: 50, y: 0 },
        { x: 80, y: 0 },
        { x: 90, y: 0 },
        { x: 100, y: 0 },
      ],
      0
    )
    const sticky = {
      id: "s1",
      type: "sticky" as const,
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      z: 0,
      color: "#fff",
      text: "hi",
    }
    const doc: WhiteboardDocument = {
      version: 1,
      elements: { p1: el, s1: sticky },
    }
    const next = precisionEraseAt(doc, { x: 50, y: 0 }, 4, newId)
    expect(next.elements.p1).toBeUndefined()
    expect(next.elements.s1).toBeDefined()
    const frags = Object.values(next.elements).filter((e) => e.type === "path")
    expect(frags.length).toBeGreaterThanOrEqual(1)
    for (const f of frags) {
      expect(f.id).toMatch(/^f\d+$/)
      expect(f.id).not.toBe("p1")
    }
  })

  it("leaves path untouched when brush misses", () => {
    const el = path("p1", [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ])
    const doc: WhiteboardDocument = { version: 1, elements: { p1: el } }
    const next = precisionEraseAt(doc, { x: 500, y: 500 }, 2, () => "x")
    expect(next.elements.p1).toEqual(el)
  })
})
