import { describe, expect, it } from "vitest"
import { mapClientToBoard } from "@/canvas/whiteboard-canvas"
import {
  applyTemplateDocument,
  getWhiteboardTemplate,
} from "@/templates/catalog"
import { hitTest } from "@/document"

describe("mapClientToBoard", () => {
  it("maps viewport clicks through pan/zoom visual rect to board layout", () => {
    // Board 3000², scale 1, pan so board origin sits inside the viewport
    // (template centerOn leaves surface.left > wrapper.left).
    const rect = { left: 500, top: 100, width: 3000, height: 3000 }
    // Click on visual “Client” at board (150, 240)
    const clientX = 500 + 150
    const clientY = 100 + 240
    expect(mapClientToBoard(clientX, clientY, rect, 3000, 3000)).toEqual({
      x: 150,
      y: 240,
    })
  })

  it("accounts for CSS scale via visual width ≠ layout width", () => {
    // scale 1.1 → visual 3300 for layout 3000
    const rect = { left: 400, top: 80, width: 3300, height: 3300 }
    const board = mapClientToBoard(400 + 165, 80 + 264, rect, 3000, 3000)
    expect(board.x).toBeCloseTo(150, 5)
    expect(board.y).toBeCloseTo(240, 5)
  })

  it("stale rect (pre-centerOn) would miss template elements — documents the bug", () => {
    // After centerOn, visual Client is at client (650, 340).
    // Stale rect from resetView (board centered, surface.left much lower):
    const stale = { left: -900, top: -1100, width: 3000, height: 3000 }
    const mapped = mapClientToBoard(650, 340, stale, 3000, 3000)
    // Far from real board (150, 240) — hitTest on template would miss.
    expect(mapped.x).toBeGreaterThan(1000)
    expect(mapped.y).toBeGreaterThan(1000)
  })
})

describe("template apply + hitTest", () => {
  it("system-design template elements are hittable at their board coords", () => {
    const template = getWhiteboardTemplate("system-design")
    expect(template).toBeDefined()
    const doc = applyTemplateDocument(template!)
    // Fresh ids; find by label
    const client = Object.values(doc.elements).find(
      (el) => el.type === "shape" && el.label === "Client"
    )
    expect(client).toBeDefined()
    if (!client || client.type === "path" || client.type === "connector") {
      throw new Error("expected shape")
    }
    const id = hitTest(doc, client.x + client.w / 2, client.y + client.h / 2)
    expect(id).toBe(client.id)
  })

  it("blank template is empty", () => {
    const template = getWhiteboardTemplate("blank")!
    const doc = applyTemplateDocument(template)
    expect(Object.keys(doc.elements)).toHaveLength(0)
    expect(hitTest(doc, 100, 100)).toBeNull()
  })
})
