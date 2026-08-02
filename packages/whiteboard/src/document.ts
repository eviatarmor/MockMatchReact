import type {
  ConnectorElement,
  PathElement,
  ShapeElement,
  ShapeKind,
  StickyElement,
  TextElement,
  WhiteboardCommand,
  WhiteboardDocument,
  WhiteboardElement,
} from "./types"
import { distToSegment, pointInPolygon } from "./lib/geometry"

export function createEmptyBoard(): WhiteboardDocument {
  return { version: 1, elements: {} }
}

export function newElementId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function maxZ(doc: WhiteboardDocument): number {
  let z = 0
  for (const el of Object.values(doc.elements)) {
    if (el.z > z) z = el.z
  }
  return z
}

export function listElementsSorted(doc: WhiteboardDocument): WhiteboardElement[] {
  return Object.values(doc.elements).sort((a, b) => a.z - b.z)
}

export function isBoardEmpty(doc: WhiteboardDocument): boolean {
  return Object.keys(doc.elements).length === 0
}

export function createSticky(partial: {
  x: number
  y: number
  color?: string
  text?: string
  w?: number
  h?: number
  z?: number
}): StickyElement {
  return {
    id: newElementId(),
    type: "sticky",
    x: partial.x,
    y: partial.y,
    w: partial.w ?? 160,
    h: partial.h ?? 140,
    z: partial.z ?? 1,
    color: partial.color ?? "#fef08a",
    text: partial.text ?? "",
  }
}

export function createText(partial: {
  x: number
  y: number
  text?: string
  fontSize?: number
  w?: number
  h?: number
  z?: number
}): TextElement {
  return {
    id: newElementId(),
    type: "text",
    x: partial.x,
    y: partial.y,
    w: partial.w ?? 200,
    h: partial.h ?? 40,
    z: partial.z ?? 1,
    text: partial.text ?? "Text",
    fontSize: partial.fontSize ?? 16,
  }
}

export function createShape(partial: {
  x: number
  y: number
  shape?: ShapeKind
  fill?: string
  stroke?: string
  label?: string
  w?: number
  h?: number
  z?: number
}): ShapeElement {
  return {
    id: newElementId(),
    type: "shape",
    shape: partial.shape ?? "rect",
    x: partial.x,
    y: partial.y,
    w: partial.w ?? 140,
    h: partial.h ?? 80,
    z: partial.z ?? 1,
    fill: partial.fill ?? "#ffffff",
    stroke: partial.stroke ?? "#525252",
    label: partial.label,
  }
}

export function createPath(partial: {
  points: readonly { x: number; y: number }[]
  stroke?: string
  strokeWidth?: number
  z?: number
  strokeKind?: PathElement["strokeKind"]
  opacity?: number
}): PathElement {
  return {
    id: newElementId(),
    type: "path",
    points: partial.points,
    z: partial.z ?? 1,
    stroke: partial.stroke ?? "#171717",
    strokeWidth: partial.strokeWidth ?? 2,
    strokeKind: partial.strokeKind ?? "pen",
    opacity: partial.opacity,
  }
}

export function createConnector(partial: {
  from: ConnectorElement["from"]
  to: ConnectorElement["to"]
  stroke?: string
  strokeWidth?: number
  startArrow?: boolean
  endArrow?: boolean
  routing?: ConnectorElement["routing"]
  z?: number
}): ConnectorElement {
  return {
    id: newElementId(),
    type: "connector",
    from: partial.from,
    to: partial.to,
    z: partial.z ?? 1,
    stroke: partial.stroke ?? "#525252",
    strokeWidth: partial.strokeWidth ?? 2,
    startArrow: partial.startArrow ?? false,
    endArrow: partial.endArrow ?? true,
    routing: partial.routing ?? "elbow",
  }
}

function patchElement(
  el: WhiteboardElement,
  patch: Partial<WhiteboardElement>
): WhiteboardElement {
  // Type-narrowed shallow merge for known fields
  return { ...el, ...patch, id: el.id, type: el.type } as WhiteboardElement
}

export function applyCommand(
  doc: WhiteboardDocument,
  command: WhiteboardCommand
): WhiteboardDocument {
  switch (command.type) {
    case "setDocument":
      return command.document.version === 1
        ? command.document
        : createEmptyBoard()
    case "upsert": {
      return {
        ...doc,
        elements: { ...doc.elements, [command.element.id]: command.element },
      }
    }
    case "upsertMany": {
      const next = { ...doc.elements }
      for (const el of command.elements) next[el.id] = el
      return { ...doc, elements: next }
    }
    case "remove": {
      if (command.ids.length === 0) return doc
      const next = { ...doc.elements }
      for (const id of command.ids) delete next[id]
      return { ...doc, elements: next }
    }
    case "patch": {
      const existing = doc.elements[command.id]
      if (!existing) return doc
      return {
        ...doc,
        elements: {
          ...doc.elements,
          [command.id]: patchElement(existing, command.patch),
        },
      }
    }
    case "move": {
      if (command.ids.length === 0 || (command.dx === 0 && command.dy === 0)) {
        return doc
      }
      const next = { ...doc.elements }
      for (const id of command.ids) {
        const el = next[id]
        if (!el) continue
        if (el.type === "path") {
          next[id] = {
            ...el,
            points: el.points.map((p) => ({
              x: p.x + command.dx,
              y: p.y + command.dy,
            })),
          }
          continue
        }
        if (el.type === "connector") {
          // Only move free-point ends; element-anchored ends stay attached
          const from =
            el.from.kind === "point"
              ? {
                  kind: "point" as const,
                  x: el.from.x + command.dx,
                  y: el.from.y + command.dy,
                }
              : el.from
          const to =
            el.to.kind === "point"
              ? {
                  kind: "point" as const,
                  x: el.to.x + command.dx,
                  y: el.to.y + command.dy,
                }
              : el.to
          next[id] = { ...el, from, to }
          continue
        }
        next[id] = {
          ...el,
          x: el.x + command.dx,
          y: el.y + command.dy,
        }
      }
      return { ...doc, elements: next }
    }
    default:
      return doc
  }
}

export function cloneDocument(doc: WhiteboardDocument): WhiteboardDocument {
  return {
    version: 1,
    elements: Object.fromEntries(
      Object.entries(doc.elements).map(([id, el]) => {
        if (el.type === "path") {
          return [id, { ...el, points: el.points.map((p) => ({ ...p })) }]
        }
        if (el.type === "connector") {
          return [id, { ...el, from: { ...el.from }, to: { ...el.to } }]
        }
        return [id, { ...el }]
      })
    ),
  }
}

/** Remap element ids (for template apply / paste). Connectors update element refs. */
export function remapDocumentIds(doc: WhiteboardDocument): WhiteboardDocument {
  const idMap = new Map<string, string>()
  for (const id of Object.keys(doc.elements)) {
    idMap.set(id, newElementId())
  }
  const elements: Record<string, WhiteboardElement> = {}
  for (const el of Object.values(doc.elements)) {
    const id = idMap.get(el.id)!
    if (el.type === "connector") {
      const remapEnd = (end: ConnectorElement["from"]): ConnectorElement["from"] => {
        if (end.kind === "point") return { ...end }
        const nextId = idMap.get(end.elementId) ?? end.elementId
        return { ...end, elementId: nextId }
      }
      elements[id] = {
        ...el,
        id,
        from: remapEnd(el.from),
        to: remapEnd(el.to),
      }
      continue
    }
    if (el.type === "path") {
      elements[id] = {
        ...el,
        id,
        points: el.points.map((p) => ({ ...p })),
      }
      continue
    }
    elements[id] = { ...el, id }
  }
  return { version: 1, elements }
}

export function elementBounds(el: WhiteboardElement): {
  x: number
  y: number
  w: number
  h: number
} {
  if (el.type === "path") {
    if (el.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const p of el.points) {
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
  if (el.type === "connector") {
    // Approximate from free points only; host may recompute with anchors
    const pts: { x: number; y: number }[] = []
    if (el.from.kind === "point") pts.push(el.from)
    if (el.to.kind === "point") pts.push(el.to)
    if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    return {
      x: minX,
      y: minY,
      w: Math.max(1, Math.max(...xs) - minX),
      h: Math.max(1, Math.max(...ys) - minY),
    }
  }
  return { x: el.x, y: el.y, w: el.w, h: el.h }
}

export function resolveConnectorPoint(
  end: ConnectorElement["from"] | ConnectorElement["to"],
  doc: WhiteboardDocument
): { x: number; y: number } {
  if (end.kind === "point") return { x: end.x, y: end.y }
  const el = doc.elements[end.elementId]
  if (!el || el.type === "path" || el.type === "connector") {
    return { x: 0, y: 0 }
  }
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  switch (end.anchor) {
    case "n":
      return { x: cx, y: el.y }
    case "s":
      return { x: cx, y: el.y + el.h }
    case "e":
      return { x: el.x + el.w, y: cy }
    case "w":
      return { x: el.x, y: cy }
    case "c":
    default:
      return { x: cx, y: cy }
  }
}

/** Select element ids whose center (or path points) lie inside lasso polygon. */
export function lassoSelectIds(
  doc: WhiteboardDocument,
  poly: readonly { x: number; y: number }[]
): string[] {
  if (poly.length < 3) return []
  const ids: string[] = []
  for (const el of Object.values(doc.elements)) {
    if (el.type === "path") {
      if (el.points.some((p) => pointInPolygon(p, poly))) ids.push(el.id)
      continue
    }
    if (el.type === "connector") {
      const a = resolveConnectorPoint(el.from, doc)
      const b = resolveConnectorPoint(el.to, doc)
      if (pointInPolygon(a, poly) || pointInPolygon(b, poly)) ids.push(el.id)
      continue
    }
    const cx = el.x + el.w / 2
    const cy = el.y + el.h / 2
    if (pointInPolygon({ x: cx, y: cy }, poly)) ids.push(el.id)
  }
  return ids
}

function pathHitsPoint(
  el: PathElement,
  x: number,
  y: number,
  pad = 6
): boolean {
  const threshold = pad + el.strokeWidth / 2
  if (el.points.length === 0) return false
  if (el.points.length === 1) {
    return distToSegment({ x, y }, el.points[0]!, el.points[0]!) <= threshold
  }
  for (let i = 1; i < el.points.length; i++) {
    if (
      distToSegment({ x, y }, el.points[i - 1]!, el.points[i]!) <= threshold
    ) {
      return true
    }
  }
  return false
}

export function hitTest(
  doc: WhiteboardDocument,
  x: number,
  y: number
): string | null {
  const sorted = listElementsSorted(doc).slice().reverse()
  const p = { x, y }
  for (const el of sorted) {
    if (el.type === "path") {
      if (pathHitsPoint(el, x, y)) return el.id
      continue
    }
    if (el.type === "connector") {
      const a = resolveConnectorPoint(el.from, doc)
      const b = resolveConnectorPoint(el.to, doc)
      if (distToSegment(p, a, b) < 8) return el.id
      continue
    }
    if (x >= el.x && x <= el.x + el.w && y >= el.y && y <= el.y + el.h) {
      return el.id
    }
  }
  return null
}
