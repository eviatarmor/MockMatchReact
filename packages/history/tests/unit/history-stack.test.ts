import { describe, expect, it } from "vitest"
import { createHistoryStack } from "../../src/index"

type Doc = { n: number }

function clone(d: Doc): Doc {
  return { n: d.n }
}

describe("createHistoryStack", () => {
  it("starts with present only", () => {
    const h = createHistoryStack({ n: 0 }, { clone })
    expect(h.present).toEqual({ n: 0 })
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })

  it("commit / undo / redo", () => {
    const h = createHistoryStack({ n: 0 }, { clone })
    h.commit({ n: 1 })
    h.commit({ n: 2 })
    expect(h.present.n).toBe(2)
    expect(h.canUndo).toBe(true)

    h.undo()
    expect(h.present.n).toBe(1)
    expect(h.canRedo).toBe(true)

    h.redo()
    expect(h.present.n).toBe(2)
  })

  it("commit clears future", () => {
    const h = createHistoryStack({ n: 0 }, { clone })
    h.commit({ n: 1 })
    h.undo()
    h.commit({ n: 9 })
    expect(h.canRedo).toBe(false)
    expect(h.present.n).toBe(9)
  })

  it("no-op commit when equals", () => {
    const h = createHistoryStack({ n: 1 }, {
      clone,
      equals: (a, b) => a.n === b.n,
    })
    h.commit({ n: 1 })
    expect(h.canUndo).toBe(false)
  })

  it("respects limit", () => {
    const h = createHistoryStack({ n: 0 }, { clone, limit: 3 })
    for (let i = 1; i <= 5; i++) h.commit({ n: i })
    let steps = 0
    while (h.canUndo) {
      h.undo()
      steps += 1
    }
    expect(steps).toBe(3)
    expect(h.present.n).toBe(2)
  })

  it("replace clears stacks", () => {
    const h = createHistoryStack({ n: 0 }, { clone })
    h.commit({ n: 1 })
    h.replace({ n: 99 })
    expect(h.present.n).toBe(99)
    expect(h.canUndo).toBe(false)
  })
})
