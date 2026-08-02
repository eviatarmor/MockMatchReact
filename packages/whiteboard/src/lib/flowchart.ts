import type { ConnectorAnchor, WhiteboardElement } from "../types"

/** Board-space grid for architecture layout (matches visual grid ~24). */
export const FLOW_GRID = 16

export function snapToGrid(n: number, grid = FLOW_GRID): number {
  return Math.round(n / grid) * grid
}

export function snapPoint(
  x: number,
  y: number,
  grid = FLOW_GRID
): { x: number; y: number } {
  return { x: snapToGrid(x, grid), y: snapToGrid(y, grid) }
}

export type PortPoint = {
  readonly anchor: ConnectorAnchor
  readonly x: number
  readonly y: number
}

/** N/S/E/W ports for box-like elements (shapes, stickies, text). */
export function elementPorts(el: WhiteboardElement): PortPoint[] | null {
  if (el.type === "path" || el.type === "connector") return null
  const { x, y, w, h } = el
  const cx = x + w / 2
  const cy = y + h / 2
  return [
    { anchor: "n", x: cx, y },
    { anchor: "s", x: cx, y: y + h },
    { anchor: "e", x: x + w, y: cy },
    { anchor: "w", x: x, y: cy },
  ]
}

/** Nearest port to a board point (within maxDist), or null. */
export function nearestPort(
  el: WhiteboardElement,
  px: number,
  py: number,
  maxDist = 28
): PortPoint | null {
  const ports = elementPorts(el)
  if (!ports) return null
  let best: PortPoint | null = null
  let bestD = maxDist
  for (const p of ports) {
    const d = Math.hypot(p.x - px, p.y - py)
    if (d <= bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

/**
 * Orthogonal (elbow) polyline between two points.
 * Prefer one bend when axis-aligned; two-bend via mid otherwise.
 */
export function elbowPolyline(
  ax: number,
  ay: number,
  bx: number,
  by: number
): { x: number; y: number }[] {
  if (Math.abs(ax - bx) < 1 || Math.abs(ay - by) < 1) {
    return [
      { x: ax, y: ay },
      { x: bx, y: by },
    ]
  }
  // Horizontal then vertical (flowchart-friendly)
  const midX = (ax + bx) / 2
  return [
    { x: ax, y: ay },
    { x: midX, y: ay },
    { x: midX, y: by },
    { x: bx, y: by },
  ]
}

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w"

export function resizeHandlePoints(
  x: number,
  y: number,
  w: number,
  h: number
): { id: ResizeHandle; x: number; y: number }[] {
  return [
    { id: "nw", x, y },
    { id: "n", x: x + w / 2, y },
    { id: "ne", x: x + w, y },
    { id: "e", x: x + w, y: y + h / 2 },
    { id: "se", x: x + w, y: y + h },
    { id: "s", x: x + w / 2, y: y + h },
    { id: "sw", x, y: y + h },
    { id: "w", x, y: y + h / 2 },
  ]
}

export function applyResize(
  box: { x: number; y: number; w: number; h: number },
  handle: ResizeHandle,
  nx: number,
  ny: number,
  minSize = 32
): { x: number; y: number; w: number; h: number } {
  let { x, y, w, h } = box
  const right = x + w
  const bottom = y + h
  switch (handle) {
    case "e":
      w = Math.max(minSize, nx - x)
      break
    case "w": {
      const r = right
      x = Math.min(nx, r - minSize)
      w = r - x
      break
    }
    case "s":
      h = Math.max(minSize, ny - y)
      break
    case "n": {
      const b = bottom
      y = Math.min(ny, b - minSize)
      h = b - y
      break
    }
    case "se":
      w = Math.max(minSize, nx - x)
      h = Math.max(minSize, ny - y)
      break
    case "sw": {
      const r = right
      x = Math.min(nx, r - minSize)
      w = r - x
      h = Math.max(minSize, ny - y)
      break
    }
    case "ne": {
      const b = bottom
      w = Math.max(minSize, nx - x)
      y = Math.min(ny, b - minSize)
      h = b - y
      break
    }
    case "nw": {
      const r = right
      const b = bottom
      x = Math.min(nx, r - minSize)
      y = Math.min(ny, b - minSize)
      w = r - x
      h = b - y
      break
    }
  }
  return {
    x: snapToGrid(x),
    y: snapToGrid(y),
    w: Math.max(minSize, snapToGrid(w)),
    h: Math.max(minSize, snapToGrid(h)),
  }
}
