import type { PathElement, WhiteboardDocument, WhiteboardElement } from "../types"
import { dist, distToSegment, type Point } from "./geometry"

/** Whole-stroke eraser: hit path if brush center is near any segment. */
export function pathHitsBrush(
  el: PathElement,
  brush: Point,
  radius: number
): boolean {
  if (el.points.length === 0) return false
  if (el.points.length === 1) {
    return dist(brush, el.points[0]!) <= radius + el.strokeWidth / 2
  }
  for (let i = 1; i < el.points.length; i++) {
    if (
      distToSegment(brush, el.points[i - 1]!, el.points[i]!) <=
      radius + el.strokeWidth / 2
    ) {
      return true
    }
  }
  return false
}

/**
 * Precision eraser: drop points within radius; split path into fragments.
 * Returns zero or more replacement path elements (same style, new ids later).
 */
export function erasePathPoints(
  el: PathElement,
  brush: Point,
  radius: number
): PathElement[] {
  if (el.points.length === 0) return []
  const keep: boolean[] = el.points.map(
    (p) => dist(brush, p) > radius + el.strokeWidth / 2
  )
  // Also drop mid-segment hits by marking nearest points
  for (let i = 1; i < el.points.length; i++) {
    if (
      distToSegment(brush, el.points[i - 1]!, el.points[i]!) <=
      radius + el.strokeWidth / 2
    ) {
      keep[i - 1] = false
      keep[i] = false
    }
  }

  const fragments: PathElement[] = []
  let current: Point[] = []
  const flush = () => {
    if (current.length >= 2) {
      fragments.push({
        ...el,
        points: current,
      })
    }
    current = []
  }
  for (let i = 0; i < el.points.length; i++) {
    if (keep[i]) {
      current.push({ x: el.points[i]!.x, y: el.points[i]!.y })
    } else {
      flush()
    }
  }
  flush()
  return fragments
}

/** Apply whole-stroke eraser brush at point → document without hit paths. */
export function eraseWholeStrokesAt(
  doc: WhiteboardDocument,
  brush: Point,
  radius: number
): { next: WhiteboardDocument; removedIds: string[] } {
  const removedIds: string[] = []
  const elements: Record<string, WhiteboardElement> = {}
  for (const [id, el] of Object.entries(doc.elements)) {
    if (el.type === "path" && pathHitsBrush(el, brush, radius)) {
      removedIds.push(id)
      continue
    }
    elements[id] = el
  }
  return { next: { version: 1, elements }, removedIds }
}

/**
 * Precision erase at brush → replace paths with fragments (caller assigns new ids).
 */
export function precisionEraseAt(
  doc: WhiteboardDocument,
  brush: Point,
  radius: number,
  newId: () => string
): WhiteboardDocument {
  const elements: Record<string, WhiteboardElement> = {}
  for (const [id, el] of Object.entries(doc.elements)) {
    if (el.type !== "path") {
      elements[id] = el
      continue
    }
    if (!pathHitsBrush(el, brush, radius)) {
      elements[id] = el
      continue
    }
    const fragments = erasePathPoints(el, brush, radius)
    // Original removed; fragments re-id
    for (const frag of fragments) {
      const fid = newId()
      elements[fid] = { ...frag, id: fid }
    }
  }
  return { version: 1, elements }
}
