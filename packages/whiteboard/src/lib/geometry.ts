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

function pathLength(points: readonly Point[]): number {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    len += dist(points[i - 1]!, points[i]!)
  }
  return len
}

function centroidOf(points: readonly Point[]): Point {
  let sx = 0
  let sy = 0
  const n = points.length || 1
  for (const p of points) {
    sx += p.x
    sy += p.y
  }
  return { x: sx / n, y: sy / n }
}

/**
 * Circularity score in [0, 1]. High = distances from centroid are stable
 * (circle/ellipse). Low = corners / irregular polygon.
 */
function circularityScore(points: readonly Point[]): number {
  if (points.length < 4) return 0
  const c = centroidOf(points)
  const radii = points.map((p) => dist(p, c))
  const mean = radii.reduce((a, r) => a + r, 0) / radii.length
  if (mean < 1) return 0
  let variance = 0
  for (const r of radii) variance += (r - mean) ** 2
  variance /= radii.length
  const cv = Math.sqrt(variance) / mean
  // CV ~0 for circle; triangles/rects typically 0.2–0.5+
  return Math.max(0, Math.min(1, 1 - cv * 2.2))
}

/**
 * Count sharp corners via angle change on an RDP-simplified polyline.
 * Closed strokes drop the duplicate end point and wrap.
 */
function countCorners(
  points: readonly Point[],
  closed: boolean,
  diag: number,
  minAngleDeg = 38
): number {
  const eps = Math.max(5, diag * 0.045)
  let simp = simplifyRdp(points, eps)
  if (simp.length < 3) return 0

  if (closed && simp.length > 2 && dist(simp[0]!, simp[simp.length - 1]!) < diag * 0.18) {
    simp = simp.slice(0, -1)
  }
  if (simp.length < 3) return 0

  const n = simp.length
  const limit = closed ? n : n - 1
  const start = closed ? 0 : 1
  let corners = 0
  const minRad = (minAngleDeg * Math.PI) / 180

  for (let i = start; i < limit; i++) {
    const prev = simp[(i - 1 + n) % n]!
    const cur = simp[i]!
    const next = simp[(i + 1) % n]!
    const a1 = Math.atan2(cur.y - prev.y, cur.x - prev.x)
    const a2 = Math.atan2(next.y - cur.y, next.x - cur.x)
    let da = Math.abs(a2 - a1)
    if (da > Math.PI) da = 2 * Math.PI - da
    if (da >= minRad) corners++
  }
  return corners
}

export type SmartShapeKind =
  | "line"
  | "rect"
  | "ellipse"
  | "triangle"
  | "free"

/**
 * Classify freehand stroke → smart shape.
 * Returns geometry in board space for conversion to shape/path.
 */
export function classifySmartStroke(points: readonly Point[]): {
  kind: SmartShapeKind
  /** Line endpoints or free simplified path */
  points?: Point[]
  /** Rect/ellipse/triangle bounds */
  bounds?: { x: number; y: number; w: number; h: number }
} {
  if (points.length < 2) return { kind: "free", points: [...points] }

  const simplified = simplifyRdp(points, 6)
  const start = points[0]!
  const end = points[points.length - 1]!
  const closeDist = dist(start, end)
  const b = boundsOfPoints(points)
  const diag = Math.hypot(b.w, b.h) || 1
  const pathLen = pathLength(points)

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
  const closed = closeDist < diag * 0.25 && pathLen > diag * 1.15
  if (closed) {
    const corners = countCorners(points, true, diag)
    const circ = circularityScore(points)
    const aspect = b.w / (b.h || 1)
    const areaBox = b.w * b.h

    // Polygons first — triangle must win over “roughly square → ellipse”
    if (corners === 3 && circ < 0.88) {
      return { kind: "triangle", bounds: b }
    }
    if (corners === 4 && circ < 0.88) {
      return { kind: "rect", bounds: b }
    }
    // Smooth closed stroke → ellipse
    if (circ >= 0.72) {
      return { kind: "ellipse", bounds: b }
    }
    // Soft corner counts (messy freehand)
    if (corners <= 3 && circ < 0.65 && areaBox > 400) {
      return { kind: "triangle", bounds: b }
    }
    if (corners >= 4 && corners <= 6 && circ < 0.7 && areaBox > 400) {
      return { kind: "rect", bounds: b }
    }
    // Only use aspect-ratio ellipse when stroke is actually round-ish
    if (aspect > 0.65 && aspect < 1.5 && circ >= 0.55) {
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
