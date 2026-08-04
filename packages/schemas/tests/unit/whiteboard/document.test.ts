import { describe, expect, it } from "vitest"
import {
  whiteboardBoardStatusSchema,
  whiteboardDocumentSchema,
  whiteboardElementSchema,
} from "@/whiteboard/document.js"

describe("whiteboardBoardStatusSchema", () => {
  it("allows draft/active/archived", () => {
    expect(whiteboardBoardStatusSchema.parse("active")).toBe("active")
    expect(() => whiteboardBoardStatusSchema.parse("deleted")).toThrow()
  })
})

describe("whiteboardElementSchema", () => {
  it("parses sticky", () => {
    const el = whiteboardElementSchema.parse({
      id: "s1",
      type: "sticky",
      x: 0,
      y: 0,
      w: 100,
      h: 80,
      z: 1,
      color: "#fef08a",
      text: "idea",
    })
    expect(el.type).toBe("sticky")
  })

  it("parses text", () => {
    const el = whiteboardElementSchema.parse({
      id: "t1",
      type: "text",
      x: 1,
      y: 2,
      w: 200,
      h: 40,
      z: 2,
      text: "Hello",
      fontSize: 16,
    })
    expect(el.type).toBe("text")
  })

  it("parses shape kinds", () => {
    for (const shape of [
      "rect",
      "ellipse",
      "triangle",
      "diamond",
      "line",
      "arrow",
      "elbowArrow",
      "blockArrow",
      "divider",
    ] as const) {
      expect(
        whiteboardElementSchema.parse({
          id: shape,
          type: "shape",
          shape,
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          z: 1,
          fill: "#fff",
          stroke: "#000",
        }).type
      ).toBe("shape")
    }
  })

  it("parses stencil with embedded svg", () => {
    const el = whiteboardElementSchema.parse({
      id: "st1",
      type: "stencil",
      stencilId: "basic.4-point-star",
      name: "4 Point Star",
      x: 0,
      y: 0,
      w: 96,
      h: 96,
      z: 1,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92 92"></svg>',
    })
    expect(el.type).toBe("stencil")
    if (el.type === "stencil") {
      expect(el.stencilId).toBe("basic.4-point-star")
    }
  })

  it("parses path with optional strokeKind/opacity", () => {
    const el = whiteboardElementSchema.parse({
      id: "p1",
      type: "path",
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
      z: 3,
      stroke: "#000",
      strokeWidth: 2,
      strokeKind: "highlighter",
      opacity: 0.5,
    })
    expect(el.type).toBe("path")
    if (el.type === "path") {
      expect(el.opacity).toBe(0.5)
    }
  })

  it("rejects path opacity out of range", () => {
    expect(() =>
      whiteboardElementSchema.parse({
        id: "p1",
        type: "path",
        points: [{ x: 0, y: 0 }],
        z: 1,
        stroke: "#000",
        strokeWidth: 1,
        opacity: 1.5,
      })
    ).toThrow()
  })

  it("parses connector with point + element ends", () => {
    const el = whiteboardElementSchema.parse({
      id: "c1",
      type: "connector",
      from: { kind: "point", x: 0, y: 0 },
      to: { kind: "element", elementId: "s1", anchor: "e" },
      z: 4,
      stroke: "#333",
      strokeWidth: 1,
      startArrow: false,
      endArrow: true,
      routing: "elbow",
    })
    expect(el.type).toBe("connector")
  })

  it("rejects bad connector anchor", () => {
    expect(() =>
      whiteboardElementSchema.parse({
        id: "c1",
        type: "connector",
        from: { kind: "element", elementId: "a", anchor: "ne" },
        to: { kind: "point", x: 1, y: 1 },
        z: 1,
        stroke: "#000",
        strokeWidth: 1,
        startArrow: false,
        endArrow: false,
      })
    ).toThrow()
  })
})

describe("whiteboardDocumentSchema", () => {
  it("requires version 1", () => {
    const doc = whiteboardDocumentSchema.parse({ version: 1, elements: {} })
    expect(doc.version).toBe(1)
    expect(() =>
      whiteboardDocumentSchema.parse({ version: 2, elements: {} })
    ).toThrow()
  })

  it("accepts element record", () => {
    const doc = whiteboardDocumentSchema.parse({
      version: 1,
      elements: {
        s1: {
          id: "s1",
          type: "sticky",
          x: 0,
          y: 0,
          w: 10,
          h: 10,
          z: 1,
          color: "#fff",
          text: "",
        },
      },
    })
    expect(Object.keys(doc.elements)).toEqual(["s1"])
  })
})
