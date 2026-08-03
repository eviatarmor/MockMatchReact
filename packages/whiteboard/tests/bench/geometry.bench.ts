import { bench, describe } from "vitest"
import {
  boundsOfPoints,
  distToSegment,
  pointInPolygon,
  simplifyRdp,
} from "@/lib/geometry"

const poly = Array.from({ length: 64 }, (_, i) => {
  const t = (i / 64) * Math.PI * 2
  return { x: Math.cos(t) * 100, y: Math.sin(t) * 80 }
})

const stroke = Array.from({ length: 400 }, (_, i) => ({
  x: i * 0.5,
  y: Math.sin(i / 12) * 20 + i * 0.02,
}))

describe("whiteboard geometry (ink / hit-test)", () => {
  bench("pointInPolygon 64-gon", () => {
    pointInPolygon({ x: 10, y: 5 }, poly)
  })

  bench("distToSegment", () => {
    distToSegment({ x: 50, y: 10 }, { x: 0, y: 0 }, { x: 100, y: 0 })
  })

  bench("boundsOfPoints 400", () => {
    boundsOfPoints(stroke)
  })

  bench("simplifyRdp 400 pts ε=1", () => {
    simplifyRdp(stroke, 1)
  })
})
