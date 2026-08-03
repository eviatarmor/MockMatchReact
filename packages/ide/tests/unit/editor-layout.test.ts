import { describe, expect, it } from "vitest"
import {
  anyOtherGroupHasTab,
  collectGroupIds,
  countLeaves,
  createRootLayout,
  emptyGroup,
  ensureOpen,
  firstLeafId,
  pickNeighborGroupId,
  removeFromGroup,
  removeGroupFromLayout,
  splitLayout,
  type EditorLayoutBranch,
  type EditorLayoutNode,
} from "@/editor-layout"

describe("group state helpers", () => {
  it("emptyGroup starts with no tabs", () => {
    expect(emptyGroup()).toEqual({ openTabIds: [], activeTabId: undefined })
  })

  it("ensureOpen adds tab and activates it", () => {
    const g0 = emptyGroup()
    const g1 = ensureOpen(g0, "a.ts")
    expect(g1.openTabIds).toEqual(["a.ts"])
    expect(g1.activeTabId).toBe("a.ts")

    const g2 = ensureOpen(g1, "a.ts")
    expect(g2.openTabIds).toEqual(["a.ts"])
    expect(g2.activeTabId).toBe("a.ts")

    const g3 = ensureOpen(g1, "b.ts")
    expect(g3.openTabIds).toEqual(["a.ts", "b.ts"])
    expect(g3.activeTabId).toBe("b.ts")
  })

  it("removeFromGroup reassigns active to last remaining", () => {
    const g = ensureOpen(ensureOpen(emptyGroup(), "a"), "b")
    const next = removeFromGroup(g, "b")
    expect(next.openTabIds).toEqual(["a"])
    expect(next.activeTabId).toBe("a")

    const empty = removeFromGroup(next, "a")
    expect(empty.openTabIds).toEqual([])
    expect(empty.activeTabId).toBeUndefined()
  })
})

describe("layout tree helpers", () => {
  it("createRootLayout is a single leaf", () => {
    const root = createRootLayout("g1")
    expect(root).toEqual({ type: "leaf", groupId: "g1" })
    expect(countLeaves(root)).toBe(1)
    expect(collectGroupIds(root)).toEqual(["g1"])
    expect(firstLeafId(root)).toBe("g1")
  })

  it("splitLayout right adds sibling on same axis", () => {
    let root: EditorLayoutNode = createRootLayout("g1")
    root = splitLayout(root, "g1", "right", "g2", "b1")
    expect(root.type).toBe("branch")
    const branch = root as EditorLayoutBranch
    expect(branch.orientation).toBe("horizontal")
    expect(collectGroupIds(root)).toEqual(["g1", "g2"])
    expect(countLeaves(root)).toBe(2)
  })

  it("splitLayout left places new group before", () => {
    let root: EditorLayoutNode = createRootLayout("g1")
    root = splitLayout(root, "g1", "left", "g2", "b1")
    expect(collectGroupIds(root)).toEqual(["g2", "g1"])
  })

  it("orthogonal split nests a branch", () => {
    let root: EditorLayoutNode = createRootLayout("g1")
    root = splitLayout(root, "g1", "right", "g2", "h1")
    root = splitLayout(root, "g1", "down", "g3", "v1")
    expect(countLeaves(root)).toBe(3)
    expect(collectGroupIds(root).sort()).toEqual(["g1", "g2", "g3"])
  })

  it("pickNeighborGroupId prefers sibling leaf", () => {
    let root: EditorLayoutNode = createRootLayout("g1")
    root = splitLayout(root, "g1", "right", "g2", "b1")
    expect(pickNeighborGroupId(root, "g1")).toBe("g2")
    expect(pickNeighborGroupId(root, "g2")).toBe("g1")
  })

  it("removeGroupFromLayout collapses single-child branches", () => {
    let root: EditorLayoutNode = createRootLayout("g1")
    root = splitLayout(root, "g1", "right", "g2", "b1")
    const only = removeGroupFromLayout(root, "g2")
    expect(only).toEqual({ type: "leaf", groupId: "g1" })

    expect(removeGroupFromLayout(only!, "g1")).toBeNull()
  })
})

describe("anyOtherGroupHasTab", () => {
  it("detects tab open elsewhere", () => {
    const groups = {
      g1: ensureOpen(emptyGroup(), "a.ts"),
      g2: ensureOpen(emptyGroup(), "b.ts"),
    }
    expect(anyOtherGroupHasTab(groups, "a.ts", "g1")).toBe(false)
    expect(anyOtherGroupHasTab(groups, "a.ts", "g2")).toBe(true)
    expect(anyOtherGroupHasTab(groups, "missing", "g1")).toBe(false)
  })
})
