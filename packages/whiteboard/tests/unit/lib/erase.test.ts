import { describe, expect, it } from "vitest"
import type { ConnectorElement, PathElement, WhiteboardDocument } from "@/types"
import {
  connectorHitsBrush,
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

function connector(
  id: string,
  from: ConnectorElement["from"],
  to: ConnectorElement["to"],
  opts?: Partial<Pick<ConnectorElement, "routing" | "strokeWidth">>
): ConnectorElement {
  return {
    id,
    type: "connector",
    from,
    to,
    z: 1,
    stroke: "#525252",
    strokeWidth: opts?.strokeWidth ?? 2,
    startArrow: false,
    endArrow: true,
    routing: opts?.routing ?? "straight",
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

describe("connectorHitsBrush", () => {
  it("hits straight connector along the segment", () => {
    const el = connector(
      "c1",
      { kind: "point", x: 0, y: 0 },
      { kind: "point", x: 100, y: 0 }
    )
    const doc: WhiteboardDocument = { version: 1, elements: { c1: el } }
    expect(connectorHitsBrush(el, doc, { x: 50, y: 1 }, 4)).toBe(true)
    expect(connectorHitsBrush(el, doc, { x: 50, y: 40 }, 4)).toBe(false)
  })

  it("uses elbow polyline, not A→B diagonal", () => {
    const a = {
      id: "a",
      type: "shape" as const,
      x: 0,
      y: 0,
      w: 100,
      h: 60,
      z: 0,
      shape: "rect" as const,
      stroke: "#000",
      fill: "transparent",
      strokeWidth: 1,
    }
    const b = {
      id: "b",
      type: "shape" as const,
      x: 200,
      y: 100,
      w: 100,
      h: 60,
      z: 0,
      shape: "rect" as const,
      stroke: "#000",
      fill: "transparent",
      strokeWidth: 1,
    }
    const el = connector(
      "c1",
      { kind: "element", elementId: "a", anchor: "e" },
      { kind: "element", elementId: "b", anchor: "w" },
      { routing: "elbow" }
    )
    const doc: WhiteboardDocument = {
      version: 1,
      elements: { a, b, c1: el },
    }
    // First elbow segment midpoint (same geometry as hitTest coverage)
    expect(connectorHitsBrush(el, doc, { x: 100, y: 30 }, 6)).toBe(true)
    // Far from any elbow segment
    expect(connectorHitsBrush(el, doc, { x: 0, y: 200 }, 4)).toBe(false)
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

  it("removes hit connectors and keeps non-hit shapes", () => {
    const hitConn = connector(
      "c-hit",
      { kind: "point", x: 0, y: 0 },
      { kind: "point", x: 100, y: 0 }
    )
    const missConn = connector(
      "c-miss",
      { kind: "point", x: 0, y: 100 },
      { kind: "point", x: 100, y: 100 }
    )
    const sticky = {
      id: "s1",
      type: "sticky" as const,
      x: 40,
      y: -5,
      w: 20,
      h: 10,
      z: 0,
      color: "#fff",
      text: "hi",
    }
    const doc: WhiteboardDocument = {
      version: 1,
      elements: { "c-hit": hitConn, "c-miss": missConn, s1: sticky },
    }
    const { next, removedIds } = eraseWholeStrokesAt(doc, { x: 50, y: 0 }, 4)
    expect(removedIds).toEqual(["c-hit"])
    expect(next.elements["c-hit"]).toBeUndefined()
    expect(next.elements["c-miss"]).toBeDefined()
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

  it("removes whole connector on precision hit (no fragments)", () => {
    const conn = connector(
      "c1",
      { kind: "point", x: 0, y: 0 },
      { kind: "point", x: 80, y: 0 }
    )
    const sticky = {
      id: "s1",
      type: "sticky" as const,
      x: 0,
      y: 20,
      w: 10,
      h: 10,
      z: 0,
      color: "#fff",
      text: "hi",
    }
    const doc: WhiteboardDocument = {
      version: 1,
      elements: { c1: conn, s1: sticky },
    }
    const next = precisionEraseAt(doc, { x: 40, y: 0 }, 4, () => "unused")
    expect(next.elements.c1).toBeUndefined()
    expect(next.elements.s1).toBeDefined()
  })

  it("keeps connector when precision brush misses", () => {
    const conn = connector(
      "c1",
      { kind: "point", x: 0, y: 0 },
      { kind: "point", x: 80, y: 0 }
    )
    const doc: WhiteboardDocument = { version: 1, elements: { c1: conn } }
    const next = precisionEraseAt(doc, { x: 40, y: 50 }, 4, () => "unused")
    expect(next.elements.c1).toEqual(conn)
  })
})
