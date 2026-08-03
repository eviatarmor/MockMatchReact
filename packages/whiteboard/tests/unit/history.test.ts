import { describe, expect, it } from "vitest"
import {
  createEmptyBoard,
  createSticky,
  isBoardEmpty,
} from "@/document"
import { createHistory } from "@/history"

describe("createHistory", () => {
  it("starts at initial present", () => {
    const board = createEmptyBoard()
    const h = createHistory(board)
    expect(isBoardEmpty(h.document)).toBe(true)
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })

  it("dispatch pushes undo; redo restores", () => {
    const h = createHistory(createEmptyBoard())
    const sticky = createSticky({ x: 1, y: 2 })
    h.dispatch({ type: "upsert", element: sticky })
    expect(h.document.elements[sticky.id]?.type).toBe("sticky")
    expect(h.canUndo).toBe(true)

    h.undo()
    expect(isBoardEmpty(h.document)).toBe(true)
    expect(h.canRedo).toBe(true)

    h.redo()
    expect(h.document.elements[sticky.id]?.type).toBe("sticky")
    expect(h.canRedo).toBe(false)
  })

  it("no-op command does not push history", () => {
    const h = createHistory(createEmptyBoard())
    const before = h.document
    // empty remove list is a no-op (same doc reference)
    const out = h.dispatch({ type: "remove", ids: [] })
    expect(out).toBe(before)
    expect(h.canUndo).toBe(false)
  })

  it("replace clears stacks", () => {
    const h = createHistory(createEmptyBoard())
    const sticky = createSticky({ x: 0, y: 0 })
    h.dispatch({ type: "upsert", element: sticky })
    h.replace(createEmptyBoard())
    expect(isBoardEmpty(h.document)).toBe(true)
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })

  it("setPresent keeps history stacks", () => {
    const h = createHistory(createEmptyBoard())
    const sticky = createSticky({ x: 0, y: 0 })
    h.dispatch({ type: "upsert", element: sticky })
    h.undo()
    expect(h.canRedo).toBe(true)
    h.setPresent({
      version: 1,
      elements: { [sticky.id]: sticky },
    })
    expect(h.document.elements[sticky.id]).toBeTruthy()
    expect(h.canRedo).toBe(true)
  })

  it("respects history limit", () => {
    const h = createHistory(createEmptyBoard(), 3)
    for (let i = 0; i < 5; i++) {
      const sticky = createSticky({ x: i, y: i })
      h.dispatch({ type: "upsert", element: sticky })
    }
    let steps = 0
    while (h.canUndo && steps < 10) {
      h.undo()
      steps++
    }
    expect(steps).toBeLessThanOrEqual(3)
  })
})
