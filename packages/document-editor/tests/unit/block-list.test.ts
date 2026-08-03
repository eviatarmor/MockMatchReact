import { describe, expect, it, vi } from "vitest"
import {
  blockListReducer,
  type BlockBase,
  type BlockTypeMeta,
} from "@/block-list"

type TestBlock = BlockBase & { type: "a" | "b"; label: string }

const registry: readonly BlockTypeMeta<TestBlock>[] = [
  {
    type: "a",
    icon: {} as BlockTypeMeta<TestBlock>["icon"],
    labelKey: "a",
    make: () => ({ id: "new-a", type: "a", label: "A" }),
  },
  {
    type: "b",
    icon: {} as BlockTypeMeta<TestBlock>["icon"],
    labelKey: "b",
    make: () => ({ id: "new-b", type: "b", label: "B" }),
  },
]

const seed: readonly TestBlock[] = [
  { id: "1", type: "a", label: "one" },
  { id: "2", type: "b", label: "two" },
  { id: "3", type: "a", label: "three" },
]

describe("blockListReducer", () => {
  it("updateBlock patches matching id", () => {
    const next = blockListReducer(registry, seed, {
      kind: "updateBlock",
      id: "2",
      patch: { label: "TWO" },
    })
    expect(next.find((b) => b.id === "2")?.label).toBe("TWO")
    expect(next.find((b) => b.id === "1")?.label).toBe("one")
  })

  it("addBlock appends or inserts after id", () => {
    const append = blockListReducer(registry, seed, {
      kind: "addBlock",
      blockType: "b",
    })
    expect(append).toHaveLength(4)
    expect(append[3]?.id).toBe("new-b")

    const after = blockListReducer(registry, seed, {
      kind: "addBlock",
      blockType: "a",
      afterId: "1",
    })
    expect(after.map((b) => b.id)).toEqual(["1", "new-a", "2", "3"])
  })

  it("addBlock ignores unknown type", () => {
    const next = blockListReducer(registry, seed, {
      kind: "addBlock",
      blockType: "missing" as TestBlock["type"],
    })
    expect(next).toBe(seed)
  })

  it("duplicateBlock clones with new id after original", () => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "dup-id",
    })
    const next = blockListReducer(registry, seed, {
      kind: "duplicateBlock",
      id: "1",
    })
    expect(next.map((b) => b.id)).toEqual(["1", "dup-id", "2", "3"])
    expect(next[1]?.label).toBe("one")
    vi.unstubAllGlobals()
  })

  it("removeBlock drops id", () => {
    const next = blockListReducer(registry, seed, {
      kind: "removeBlock",
      id: "2",
    })
    expect(next.map((b) => b.id)).toEqual(["1", "3"])
  })

  it("moveBlock swaps with neighbor; clamps edges", () => {
    const up = blockListReducer(registry, seed, {
      kind: "moveBlock",
      id: "2",
      direction: "up",
    })
    expect(up.map((b) => b.id)).toEqual(["2", "1", "3"])

    const edge = blockListReducer(registry, seed, {
      kind: "moveBlock",
      id: "1",
      direction: "up",
    })
    expect(edge).toBe(seed)
  })

  it("reorderBlocks moves active over target", () => {
    const next = blockListReducer(registry, seed, {
      kind: "reorderBlocks",
      activeId: "3",
      overId: "1",
    })
    expect(next.map((b) => b.id)).toEqual(["3", "1", "2"])
  })

  it("replaceAll swaps entire list", () => {
    const blocks: TestBlock[] = [{ id: "x", type: "b", label: "x" }]
    const next = blockListReducer(registry, seed, {
      kind: "replaceAll",
      blocks,
    })
    expect(next).toBe(blocks)
  })
})
