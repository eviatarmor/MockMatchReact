import { describe, expect, it } from "vitest"
import {
  boundsOfPoints,
  dist,
  distToSegment,
  pointInPolygon,
  simplifyRdp,
} from "@/lib/geometry"

describe("dist", () => {
  it("computes euclidean distance", () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe("distToSegment", () => {
  it("returns 0 on segment", () => {
    expect(
      distToSegment({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 })
    ).toBe(0)
  })

  it("returns distance to nearest endpoint when beyond", () => {
    expect(
      distToSegment({ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 })
    ).toBe(1)
  })
})

describe("pointInPolygon", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ]

  it("detects inside/outside", () => {
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true)
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false)
  })

  it("false for tiny poly", () => {
    expect(pointInPolygon({ x: 0, y: 0 }, [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBe(
      false
    )
  })
})

describe("boundsOfPoints", () => {
  it("empty → zero box", () => {
    expect(boundsOfPoints([])).toEqual({ x: 0, y: 0, w: 0, h: 0 })
  })

  it("computes min/max", () => {
    expect(
      boundsOfPoints([
        { x: 1, y: 2 },
        { x: 5, y: 8 },
      ])
    ).toEqual({ x: 1, y: 2, w: 4, h: 6 })
  })
})

describe("simplifyRdp", () => {
  it("keeps short paths", () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]
    expect(simplifyRdp(pts, 1)).toHaveLength(2)
  })
})
