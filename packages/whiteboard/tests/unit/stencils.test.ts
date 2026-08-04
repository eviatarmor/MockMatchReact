import { describe, expect, it } from "vitest"
import {
  createEmptyBoard,
  createStencil,
  maxZ,
  stencilDisplaySize,
  applyCommand,
} from "../../src/document"
import {
  STENCIL_CATEGORIES,
  STENCIL_SHAPE_COUNT,
  searchStencilIndex,
} from "../../src/stencils/catalog"

describe("stencilDisplaySize", () => {
  it("scales max edge to 96 preserving aspect", () => {
    const s = stencilDisplaySize(200, 100)
    expect(s.w).toBe(96)
    expect(s.h).toBe(48)
  })
})

describe("createStencil", () => {
  it("embeds svg and uses display size from native dims", () => {
    const el = createStencil({
      x: 10,
      y: 20,
      stencilId: "basic.4-point-star",
      name: "4 Point Star",
      svg: '<svg viewBox="0 0 92 92"></svg>',
      nativeW: 92,
      nativeH: 92,
      z: 3,
    })
    expect(el.type).toBe("stencil")
    expect(el.stencilId).toBe("basic.4-point-star")
    expect(el.w).toBe(96)
    expect(el.h).toBe(96)
    expect(el.svg).toContain("svg")
  })

  it("upserts onto the document", () => {
    let doc = createEmptyBoard()
    const el = createStencil({
      x: 0,
      y: 0,
      stencilId: "test.icon",
      name: "Test",
      svg: "<svg/>",
      w: 48,
      h: 48,
      z: maxZ(doc) + 1,
    })
    doc = applyCommand(doc, { type: "upsert", element: el })
    expect(doc.elements[el.id]?.type).toBe("stencil")
  })
})

describe("stencil catalog", () => {
  it("has generated libraries", () => {
    expect(STENCIL_SHAPE_COUNT).toBeGreaterThan(1000)
    expect(STENCIL_CATEGORIES.length).toBeGreaterThan(50)
  })

  it("searches by name", () => {
    const hits = searchStencilIndex("star", { limit: 20 })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => /star/i.test(h.name))).toBe(true)
  })
})
