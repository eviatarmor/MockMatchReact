import type { IdeSplitDirection } from "./types"

export type EditorGroupId = string

export type EditorGroupState = {
  openTabIds: string[]
  activeTabId?: string
}

export type EditorLayoutLeaf = {
  type: "leaf"
  groupId: EditorGroupId
}

export type EditorLayoutBranch = {
  type: "branch"
  id: string
  /** horizontal = side-by-side, vertical = stacked */
  orientation: "horizontal" | "vertical"
  children: EditorLayoutNode[]
}

export type EditorLayoutNode = EditorLayoutLeaf | EditorLayoutBranch

export function createRootLayout(groupId: EditorGroupId): EditorLayoutLeaf {
  return { type: "leaf", groupId }
}

export function emptyGroup(): EditorGroupState {
  return { openTabIds: [], activeTabId: undefined }
}

export function ensureOpen(
  group: EditorGroupState,
  tabId: string
): EditorGroupState {
  const openTabIds = group.openTabIds.includes(tabId)
    ? group.openTabIds
    : [...group.openTabIds, tabId]
  return { openTabIds, activeTabId: tabId }
}

export function removeFromGroup(
  group: EditorGroupState,
  tabId: string
): EditorGroupState {
  const openTabIds = group.openTabIds.filter((id) => id !== tabId)
  let activeTabId = group.activeTabId
  if (activeTabId === tabId) {
    activeTabId = openTabIds[openTabIds.length - 1]
  }
  return { openTabIds, activeTabId }
}

export function countLeaves(node: EditorLayoutNode): number {
  if (node.type === "leaf") return 1
  return node.children.reduce((n, c) => n + countLeaves(c), 0)
}

export function collectGroupIds(node: EditorLayoutNode): EditorGroupId[] {
  if (node.type === "leaf") return [node.groupId]
  return node.children.flatMap(collectGroupIds)
}

export function firstLeafId(node: EditorLayoutNode): EditorGroupId {
  if (node.type === "leaf") return node.groupId
  return firstLeafId(node.children[0]!)
}

/** Prefer a direct sibling leaf; fall back to first remaining leaf. */
export function pickNeighborGroupId(
  root: EditorLayoutNode,
  groupId: EditorGroupId
): EditorGroupId | undefined {
  function walk(node: EditorLayoutNode): EditorGroupId | undefined {
    if (node.type === "leaf") return undefined
    const idx = node.children.findIndex(
      (c) => c.type === "leaf" && c.groupId === groupId
    )
    if (idx >= 0) {
      const sibling =
        node.children[idx + 1] ?? node.children[idx - 1]
      if (sibling) return firstLeafId(sibling)
    }
    for (const child of node.children) {
      const found = walk(child)
      if (found) return found
    }
    return undefined
  }

  const neighbor = walk(root)
  if (neighbor) return neighbor
  return collectGroupIds(root).find((id) => id !== groupId)
}

function directionMeta(dir: IdeSplitDirection): {
  orientation: "horizontal" | "vertical"
  place: "before" | "after"
} {
  switch (dir) {
    case "left":
      return { orientation: "horizontal", place: "before" }
    case "right":
      return { orientation: "horizontal", place: "after" }
    case "up":
      return { orientation: "vertical", place: "before" }
    case "down":
      return { orientation: "vertical", place: "after" }
  }
}

/**
 * Split `targetGroupId` in `direction`, inserting a new leaf for `newGroupId`.
 * Same-axis splits add a sibling; orthogonal splits nest a new branch.
 */
export function splitLayout(
  root: EditorLayoutNode,
  targetGroupId: EditorGroupId,
  direction: IdeSplitDirection,
  newGroupId: EditorGroupId,
  newBranchId: string
): EditorLayoutNode {
  const { orientation, place } = directionMeta(direction)
  const newLeaf: EditorLayoutLeaf = { type: "leaf", groupId: newGroupId }

  function insertBeside(
    children: EditorLayoutNode[],
    index: number
  ): EditorLayoutNode[] {
    const next = [...children]
    next.splice(place === "before" ? index : index + 1, 0, newLeaf)
    return next
  }

  function wrapLeaf(leaf: EditorLayoutLeaf): EditorLayoutBranch {
    const kids =
      place === "before" ? [newLeaf, leaf] : [leaf, newLeaf]
    return {
      type: "branch",
      id: newBranchId,
      orientation,
      children: kids,
    }
  }

  function walk(node: EditorLayoutNode): EditorLayoutNode {
    if (node.type === "leaf") {
      if (node.groupId !== targetGroupId) return node
      return wrapLeaf(node)
    }

    const directIdx = node.children.findIndex(
      (c) => c.type === "leaf" && c.groupId === targetGroupId
    )
    if (directIdx >= 0) {
      if (node.orientation === orientation) {
        return { ...node, children: insertBeside(node.children, directIdx) }
      }
      const children = [...node.children]
      children[directIdx] = wrapLeaf(
        node.children[directIdx] as EditorLayoutLeaf
      )
      return { ...node, children }
    }

    return {
      ...node,
      children: node.children.map(walk),
    }
  }

  return walk(root)
}

/** Remove a leaf; collapse single-child branches. */
export function removeGroupFromLayout(
  root: EditorLayoutNode,
  groupId: EditorGroupId
): EditorLayoutNode | null {
  function walk(node: EditorLayoutNode): EditorLayoutNode | null {
    if (node.type === "leaf") {
      return node.groupId === groupId ? null : node
    }
    const children = node.children
      .map(walk)
      .filter((c): c is EditorLayoutNode => c != null)
    if (children.length === 0) return null
    if (children.length === 1) return children[0]!
    return { ...node, children }
  }
  return walk(root)
}

export function anyOtherGroupHasTab(
  groups: Record<EditorGroupId, EditorGroupState>,
  tabId: string,
  exceptGroupId: EditorGroupId
): boolean {
  for (const [id, g] of Object.entries(groups)) {
    if (id === exceptGroupId) continue
    if (g.openTabIds.includes(tabId)) return true
  }
  return false
}
