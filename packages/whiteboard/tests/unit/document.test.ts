import { describe, expect, it } from "vitest"
import {
  createEmptyBoard,
  createSticky,
  isBoardEmpty,
  listElementsSorted,
  maxZ,
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
