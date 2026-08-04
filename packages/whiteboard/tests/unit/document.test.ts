import { describe, expect, it } from "vitest"
import {
  connectorPolyline,
  createConnector,
  createEmptyBoard,
  createShape,
  createSticky,
  elementBounds,
  isBoardEmpty,
  listElementsSorted,
  marqueeSelectIds,
  maxZ,
  preparePaste,
  sliceDocument,
} from "@/document"
import { createHistory } from "@/history"

describe("whiteboard document helpers", () => {
  it("starts empty", () => {
    const board = createEmptyBoard()
    expect(isBoardEmpty(board)).toBe(true)
    expect(maxZ(board)).toBe(0)
  })

  it("creates sticky with defaults", () => {
    const s = createSticky({ x: 10, y: 20 })
    expect(s.type).toBe("sticky")
    expect(s.x).toBe(10)
    expect(s.y).toBe(20)
    expect(s.w).toBe(160)
    expect(s.color).toBe("#fef08a")
  })

  it("sorts by z", () => {
    const a = createSticky({ x: 0, y: 0, z: 2 })
    const b = createSticky({ x: 1, y: 1, z: 1 })
    const doc = {
      version: 1 as const,
      elements: { [a.id]: a, [b.id]: b },
    }
    const sorted = listElementsSorted(doc)
    expect(sorted[0]?.id).toBe(b.id)
    expect(sorted[1]?.id).toBe(a.id)
    expect(maxZ(doc)).toBe(2)
  })
})

describe("connectorPolyline / elementBounds with anchors", () => {
  it("resolves element-to-element elbow polyline", () => {
    const a = createShape({ x: 0, y: 0, w: 100, h: 60 })
    const b = createShape({ x: 200, y: 100, w: 100, h: 60 })
    const c = createConnector({
      from: { kind: "element", elementId: a.id, anchor: "e" },
      to: { kind: "element", elementId: b.id, anchor: "w" },
      routing: "elbow",
    })
    const doc = {
      version: 1 as const,
      elements: { [a.id]: a, [b.id]: b, [c.id]: c },
    }
    const pts = connectorPolyline(c, doc)
    // East of A: (100, 30); west of B: (200, 130) → elbow via midX
    expect(pts[0]).toEqual({ x: 100, y: 30 })
    expect(pts[pts.length - 1]).toEqual({ x: 200, y: 130 })
    expect(pts.length).toBeGreaterThanOrEqual(2)
  })

  it("elementBounds for attached connector needs doc", () => {
    const a = createShape({ x: 50, y: 50, w: 80, h: 40 })
    const b = createShape({ x: 250, y: 50, w: 80, h: 40 })
    const c = createConnector({
      from: { kind: "element", elementId: a.id, anchor: "e" },
      to: { kind: "element", elementId: b.id, anchor: "w" },
    })
    const doc = {
      version: 1 as const,
      elements: { [a.id]: a, [b.id]: b, [c.id]: c },
    }
    // Without doc: free points only → empty-ish
    const bare = elementBounds(c)
    expect(bare.w).toBe(0)
    expect(bare.h).toBe(0)

    const withDoc = elementBounds(c, doc)
    expect(withDoc.x).toBe(130) // a.x + a.w
    expect(withDoc.w).toBeGreaterThan(0)
    expect(withDoc.x + withDoc.w).toBe(250) // b.x
  })

  it("straight routing is two points", () => {
    const c = createConnector({
      from: { kind: "point", x: 0, y: 0 },
      to: { kind: "point", x: 40, y: 20 },
      routing: "straight",
    })
    const doc = { version: 1 as const, elements: { [c.id]: c } }
    expect(connectorPolyline(c, doc)).toEqual([
      { x: 0, y: 0 },
      { x: 40, y: 20 },
    ])
  })
})

describe("marqueeSelectIds", () => {
  it("selects box elements that overlap the rect", () => {
    const a = createSticky({ x: 0, y: 0, w: 100, h: 100 })
    const b = createShape({ x: 200, y: 200, w: 50, h: 50 })
    const doc = {
      version: 1 as const,
      elements: { [a.id]: a, [b.id]: b },
    }
    const ids = marqueeSelectIds(doc, { x: -10, y: -10, w: 80, h: 80 })
    expect(ids).toContain(a.id)
    expect(ids).not.toContain(b.id)
  })

  it("normalizes inverted drag rect", () => {
    const a = createShape({ x: 50, y: 50, w: 40, h: 40 })
    const doc = {
      version: 1 as const,
      elements: { [a.id]: a },
    }
    // Drag from bottom-right toward top-left
    const ids = marqueeSelectIds(doc, { x: 120, y: 120, w: -100, h: -100 })
    expect(ids).toEqual([a.id])
  })

  it("returns empty for tiny click rect", () => {
    const a = createSticky({ x: 0, y: 0 })
    const doc = {
      version: 1 as const,
      elements: { [a.id]: a },
    }
    expect(marqueeSelectIds(doc, { x: 10, y: 10, w: 0, h: 0 })).toEqual([])
  })
})

describe("copy / paste helpers", () => {
  it("sliceDocument copies selected shapes only", () => {
    const a = createShape({ x: 10, y: 20, w: 40, h: 30, stroke: "#dc2626" })
    const b = createSticky({ x: 100, y: 100 })
    const doc = {
      version: 1 as const,
      elements: { [a.id]: a, [b.id]: b },
    }
    const slice = sliceDocument(doc, [a.id])
    expect(Object.keys(slice.elements)).toEqual([a.id])
    expect(slice.elements[a.id]).toMatchObject({
      type: "shape",
      x: 10,
      y: 20,
      stroke: "#dc2626",
    })
    // Deep clone — not same ref
    expect(slice.elements[a.id]).not.toBe(a)
  })

  it("preparePaste remaps ids and offsets", () => {
    const a = createShape({ x: 0, y: 0, w: 50, h: 50 })
    const clip = {
      version: 1 as const,
      elements: { [a.id]: a },
    }
    const { elements, ids } = preparePaste(clip, {
      pasteIndex: 1,
      zBase: 5,
    })
    expect(elements).toHaveLength(1)
    expect(ids).toHaveLength(1)
    expect(ids[0]).not.toBe(a.id)
    expect(elements[0]).toMatchObject({
      type: "shape",
      x: 24,
      y: 24,
      z: 6,
    })
    expect(elements[0]!.id).toBe(ids[0])
  })

  it("repeated pasteIndex stacks further offset", () => {
    const a = createShape({ x: 0, y: 0 })
    const clip = { version: 1 as const, elements: { [a.id]: a } }
    const first = preparePaste(clip, { pasteIndex: 1 })
    const second = preparePaste(clip, { pasteIndex: 2 })
    expect(first.elements[0]!.x).toBe(24)
    expect(second.elements[0]!.x).toBe(48)
    expect(first.ids[0]).not.toBe(second.ids[0])
  })
})

describe("createHistory", () => {
  it("undo/redo sticky add", () => {
    const history = createHistory(createEmptyBoard())
    const sticky = createSticky({ x: 0, y: 0 })
    history.dispatch({
      type: "upsert",
      element: sticky,
    })
    expect(isBoardEmpty(history.document)).toBe(false)
    expect(history.canUndo).toBe(true)

    history.undo()
    expect(isBoardEmpty(history.document)).toBe(true)
    expect(history.canRedo).toBe(true)

    history.redo()
    expect(history.document.elements[sticky.id]?.type).toBe("sticky")
  })
})
