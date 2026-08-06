import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createEmptyBoard,
  createShape,
  createSticky,
  createText,
  isBoardEmpty,
} from "@/document"
import {
  createHistory,
  isTextTypingPatch,
  TEXT_TYPING_BATCH_MS,
} from "@/history"

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

describe("isTextTypingPatch", () => {
  it("accepts text-only and label-only patches", () => {
    expect(
      isTextTypingPatch({ type: "patch", id: "a", patch: { text: "x" } })
    ).toEqual({ id: "a", keys: ["text"] })
    expect(
      isTextTypingPatch({ type: "patch", id: "b", patch: { label: "y" } })
    ).toEqual({ id: "b", keys: ["label"] })
  })

  it("rejects non-patch and mixed field patches", () => {
    expect(isTextTypingPatch({ type: "remove", ids: ["a"] })).toBeNull()
    expect(
      isTextTypingPatch({
        type: "patch",
        id: "a",
        patch: { text: "x", color: "#fff" } as never,
      })
    ).toBeNull()
  })
})

describe("createHistory text typing batch", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function stickyWithHistory() {
    const h = createHistory(createEmptyBoard())
    const sticky = createSticky({ x: 0, y: 0, text: "" })
    h.dispatch({ type: "upsert", element: sticky })
    return { h, sticky }
  }

  it("batches consecutive sticky keystrokes into one undo step", () => {
    const { h, sticky } = stickyWithHistory()

    for (const ch of "hello") {
      h.dispatch({
        type: "patch",
        id: sticky.id,
        patch: {
          text:
            ((h.document.elements[sticky.id] as { text: string }).text ?? "") +
            ch,
        },
      })
      vi.advanceTimersByTime(50)
    }

    expect(
      (h.document.elements[sticky.id] as { text: string }).text
    ).toBe("hello")

    // upsert + one typing batch (not 5 character steps)
    let steps = 0
    while (h.canUndo) {
      h.undo()
      steps += 1
    }
    expect(steps).toBe(2)

    // after full undo, board empty (removed sticky)
    expect(isBoardEmpty(h.document)).toBe(true)
  })

  it("one Undo after a short phrase restores pre-typing text", () => {
    const h = createHistory(createEmptyBoard())
    const sticky = createSticky({ x: 0, y: 0, text: "Hi" })
    h.dispatch({ type: "upsert", element: sticky })

    for (const next of ["Hi ", "Hi w", "Hi wo", "Hi wor", "Hi word"]) {
      h.dispatch({
        type: "patch",
        id: sticky.id,
        patch: { text: next },
      })
      vi.advanceTimersByTime(40)
    }

    expect(
      (h.document.elements[sticky.id] as { text: string }).text
    ).toBe("Hi word")

    h.undo()
    expect(
      (h.document.elements[sticky.id] as { text: string }).text
    ).toBe("Hi")
  })

  it("starts a new undo step after typing pause", () => {
    const { h, sticky } = stickyWithHistory()

    h.dispatch({
      type: "patch",
      id: sticky.id,
      patch: { text: "one" },
    })
    vi.advanceTimersByTime(TEXT_TYPING_BATCH_MS + 1)
    h.dispatch({
      type: "patch",
      id: sticky.id,
      patch: { text: "one two" },
    })

    // upsert + "one" batch + "one two" batch
    let steps = 0
    while (h.canUndo) {
      h.undo()
      steps += 1
    }
    expect(steps).toBe(3)
  })

  it("does not coalesce typing across different elements", () => {
    const h = createHistory(createEmptyBoard())
    const a = createSticky({ x: 0, y: 0, text: "" })
    const b = createSticky({ x: 10, y: 10, text: "" })
    h.dispatch({ type: "upsert", element: a })
    h.dispatch({ type: "upsert", element: b })

    h.dispatch({ type: "patch", id: a.id, patch: { text: "A" } })
    h.dispatch({ type: "patch", id: b.id, patch: { text: "B" } })

    // 2 upserts + 2 typing steps
    let steps = 0
    while (h.canUndo) {
      h.undo()
      steps += 1
    }
    expect(steps).toBe(4)
  })

  it("non-text command ends the typing batch", () => {
    const { h, sticky } = stickyWithHistory()
    h.dispatch({ type: "patch", id: sticky.id, patch: { text: "x" } })
    h.dispatch({
      type: "move",
      ids: [sticky.id],
      dx: 5,
      dy: 0,
    })
    h.dispatch({ type: "patch", id: sticky.id, patch: { text: "xy" } })

    // upsert + text x + move + text xy
    let steps = 0
    while (h.canUndo) {
      h.undo()
      steps += 1
    }
    expect(steps).toBe(4)
  })

  it("batches free-text and shape-label patches the same way", () => {
    const h = createHistory(createEmptyBoard())
    const text = createText({ x: 0, y: 0, text: "" })
    const shape = createShape({ x: 0, y: 0, label: "" })
    h.dispatch({ type: "upsert", element: text })
    h.dispatch({ type: "upsert", element: shape })

    for (const next of ["a", "ab", "abc"]) {
      h.dispatch({ type: "patch", id: text.id, patch: { text: next } })
      vi.advanceTimersByTime(20)
    }
    for (const next of ["L", "La", "Lab"]) {
      h.dispatch({ type: "patch", id: shape.id, patch: { label: next } })
      vi.advanceTimersByTime(20)
    }

    // 2 upserts + 1 text batch + 1 label batch
    let steps = 0
    while (h.canUndo) {
      h.undo()
      steps += 1
    }
    expect(steps).toBe(4)
  })
})
