import { describe, expect, it } from "vitest"
import {
  whiteboardBoardCreateInputSchema,
  whiteboardBoardDtoSchema,
  whiteboardBoardIdInputSchema,
  whiteboardBoardUpdateInputSchema,
} from "@/whiteboard/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"
const emptyDoc = { version: 1 as const, elements: {} }

describe("whiteboardBoardIdInputSchema", () => {
  it("requires uuid", () => {
    expect(whiteboardBoardIdInputSchema.parse({ id: UUID }).id).toBe(UUID)
    expect(() => whiteboardBoardIdInputSchema.parse({ id: "x" })).toThrow()
  })
})

describe("whiteboardBoardCreateInputSchema", () => {
  it("all fields optional", () => {
    expect(whiteboardBoardCreateInputSchema.parse({})).toEqual({})
  })

  it("accepts title + question + document", () => {
    const v = whiteboardBoardCreateInputSchema.parse({
      title: " Flow ",
      questionId: UUID,
      document: emptyDoc,
    })
    expect(v.title).toBe("Flow")
    expect(v.questionId).toBe(UUID)
  })

  it("rejects non-uuid questionId", () => {
    expect(() =>
      whiteboardBoardCreateInputSchema.parse({ questionId: "q1" })
    ).toThrow()
  })
})

describe("whiteboardBoardUpdateInputSchema", () => {
  it("requires id", () => {
    expect(() => whiteboardBoardUpdateInputSchema.parse({})).toThrow()
    const v = whiteboardBoardUpdateInputSchema.parse({
      id: UUID,
      status: "archived",
      title: "Done",
    })
    expect(v.status).toBe("archived")
  })
})

describe("whiteboardBoardDtoSchema", () => {
  it("parses board row", () => {
    const dto = whiteboardBoardDtoSchema.parse({
      id: UUID,
      title: "Board",
      status: "draft",
      questionId: null,
      document: emptyDoc,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    })
    expect(dto.questionId).toBeNull()
    expect(dto.document.version).toBe(1)
  })

  it("rejects missing timestamps", () => {
    expect(() =>
      whiteboardBoardDtoSchema.parse({
        id: UUID,
        title: "Board",
        status: "draft",
        questionId: null,
        document: emptyDoc,
      })
    ).toThrow()
  })
})
