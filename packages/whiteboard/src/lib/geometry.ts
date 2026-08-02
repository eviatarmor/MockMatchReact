export type Point = { readonly x: number; readonly y: number }

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function distToSegment(
  p: Point,
  a: Point,
  b: Point
): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) return dist(p, a)
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy))
  )
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** Ray-cast point-in-polygon (board space). */
export function pointInPolygon(p: Point, poly: readonly Point[]): boolean {
  if (poly.length < 3) return false
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]!.x
    const yi = poly[i]!.y
    const xj = poly[j]!.x
    const yj = poly[j]!.y
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function boundsOfPoints(pts: readonly Point[]): {
  x: number
  y: number
  w: number
  h: number
} {
  if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  }
}

/** Ramer–Douglas–Peucker simplify. */
export function simplifyRdp(
  points: readonly Point[],
  epsilon: number
): Point[] {
  if (points.length < 3) return points.map((p) => ({ x: p.x, y: p.y }))
  let maxDist = 0
  let index = 0
  const end = points.length - 1
  for (let i = 1; i < end; i++) {
    const d = distToSegment(points[i]!, points[0]!, points[end]!)
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }
  if (maxDist > epsilon) {
    const left = simplifyRdp(points.slice(0, index + 1), epsilon)
    const right = simplifyRdp(points.slice(index), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [
    { x: points[0]!.x, y: points[0]!.y },
    { x: points[end]!.x, y: points[end]!.y },
  ]
}

export type SmartShapeKind = "line" | "rect" | "ellipse" | "free"

/**
 * Classify freehand stroke → smart shape.
 * Returns geometry in board space for conversion to shape/path.
 */
export function classifySmartStroke(points: readonly Point[]): {
  kind: SmartShapeKind
  /** Line endpoints or free simplified path */
  points?: Point[]
  /** Rect/ellipse bounds */
  bounds?: { x: number; y: number; w: number; h: number }
} {
  if (points.length < 2) return { kind: "free", points: [...points] }

  const simplified = simplifyRdp(points, 6)
  const start = points[0]!
  const end = points[points.length - 1]!
  const closeDist = dist(start, end)
  const b = boundsOfPoints(points)
  const diag = Math.hypot(b.w, b.h) || 1
  const pathLen = points.reduce(
    (acc, p, i) => (i === 0 ? 0 : acc + dist(points[i - 1]!, p)),
    0
  )

  // Nearly straight → line
  const straightness = dist(start, end) / (pathLen || 1)
  if (straightness > 0.92 && simplified.length <= 3) {
    return {
      kind: "line",
      points: [
        { x: start.x, y: start.y },
        { x: end.x, y: end.y },
      ],
    }
  }

  // Closed-ish stroke
  const closed = closeDist < diag * 0.22 && pathLen > diag * 1.2
  if (closed) {
    const aspect = b.w / (b.h || 1)
    // Circular-ish → ellipse; otherwise rect
    const areaBox = b.w * b.h
    // Prefer ellipse when roughly square and path is long enough
    if (aspect > 0.65 && aspect < 1.5) {
      return { kind: "ellipse", bounds: b }
    }
    if (areaBox > 400) {
      return { kind: "rect", bounds: b }
    }
  }

  // Open stroke that looks rectangular (axis-aligned corners)
  if (simplified.length >= 4 && simplified.length <= 6) {
    return { kind: "rect", bounds: b }
  }

  return { kind: "free", points: simplifyRdp(points, 3) }
}
