import type { IdeTab, IdeTreeNode } from "@mockmatch/ide"

export function languageFromFileName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript"
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs"))
    return "javascript"
  if (lower.endsWith(".json")) return "json"
  if (lower.endsWith(".css")) return "css"
  if (lower.endsWith(".html")) return "html"
  if (lower.endsWith(".md")) return "markdown"
  if (lower.endsWith(".py")) return "python"
  if (lower.endsWith(".rs")) return "rust"
  if (lower.endsWith(".go")) return "go"
  return "plaintext"
}

function sanitizeName(raw: string): string | null {
  const name = raw.trim().replace(/[\\/]/g, "")
  if (!name || name === "." || name === "..") return null
  return name
}

/** Folder = has `children` key (even if empty). */
export function isFolderNode(node: IdeTreeNode): boolean {
  return Array.isArray(node.children)
}

/** Folders first, then files; alpha within each group. */
export function compareTreeNodes(a: IdeTreeNode, b: IdeTreeNode): number {
  const aFolder = isFolderNode(a)
  const bFolder = isFolderNode(b)
  if (aFolder !== bFolder) return aFolder ? -1 : 1
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
}

/** Insert one sibling into a list, keeping folder-first order (O(n)). */
export function insertSortedSibling(
  siblings: IdeTreeNode[],
  child: IdeTreeNode
): IdeTreeNode[] {
  const next = siblings.slice()
  let i = 0
  while (i < next.length && compareTreeNodes(next[i]!, child) <= 0) {
    i++
  }
  next.splice(i, 0, child)
  return next
}

/** Sort a single sibling list in place style (returns new array). O(n log n). */
export function sortSiblings(siblings: IdeTreeNode[]): IdeTreeNode[] {
  return siblings.slice().sort(compareTreeNodes)
}

/**
 * Insert under parentId (null = root). Only reorders that sibling list —
 * does not walk/sort the whole tree.
 */
function insertChild(
  nodes: IdeTreeNode[],
  parentId: string | null,
  child: IdeTreeNode
): IdeTreeNode[] {
  if (parentId == null) {
    return insertSortedSibling(nodes, child)
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      const children = insertSortedSibling(node.children ?? [], child)
      return { ...node, children }
    }
    if (node.children) {
      return {
        ...node,
        children: insertChild(node.children, parentId, child),
      }
    }
    return node
  })
}

/** One-time full sort of tree data (for seed constants / migration). */
export function sortTreeDeep(nodes: IdeTreeNode[]): IdeTreeNode[] {
  return sortSiblings(nodes).map((n) =>
    n.children ? { ...n, children: sortTreeDeep(n.children) } : n
  )
}

function nodeExists(nodes: IdeTreeNode[], id: string): boolean {
  for (const node of nodes) {
    if (node.id === id) return true
    if (node.children && nodeExists(node.children, id)) return true
  }
  return false
}

export function findTreeNode(
  nodes: IdeTreeNode[],
  id: string
): IdeTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const hit = findTreeNode(node.children, id)
      if (hit) return hit
    }
  }
  return null
}

export function isFileNode(node: IdeTreeNode): boolean {
  return !isFolderNode(node)
}

export function addFileToTree(
  tree: IdeTreeNode[],
  parentId: string | null,
  rawName: string
): { tree: IdeTreeNode[]; tab: IdeTab; nodeId: string } | null {
  const name = sanitizeName(rawName)
  if (!name) return null

  const nodeId = parentId ? `${parentId}/${name}` : name
  if (nodeExists(tree, nodeId)) return null

  const node: IdeTreeNode = { id: nodeId, name }
  const tab: IdeTab = {
    id: nodeId,
    title: name,
    language: languageFromFileName(name),
    value: "",
    dirty: true,
  }

  return {
    tree: insertChild(tree, parentId, node),
    tab,
    nodeId,
  }
}

export function addFolderToTree(
  tree: IdeTreeNode[],
  parentId: string | null,
  rawName: string
): { tree: IdeTreeNode[]; nodeId: string } | null {
  const name = sanitizeName(rawName)
  if (!name) return null

  const nodeId = parentId ? `${parentId}/${name}` : name
  if (nodeExists(tree, nodeId)) return null

  const node: IdeTreeNode = { id: nodeId, name, children: [] }

  return {
    tree: insertChild(tree, parentId, node),
    nodeId,
  }
}

/** Remove node and descendants. Returns null if id not found. */
export function removeNodeFromTree(
  tree: IdeTreeNode[],
  nodeId: string
): IdeTreeNode[] | null {
  let found = false

  const walk = (nodes: IdeTreeNode[]): IdeTreeNode[] => {
    const next: IdeTreeNode[] = []
    for (const node of nodes) {
      if (node.id === nodeId) {
        found = true
        continue
      }
      if (node.children) {
        next.push({ ...node, children: walk(node.children) })
      } else {
        next.push(node)
      }
    }
    return next
  }

  const result = walk(tree)
  return found ? result : null
}

/** Ids of node + all descendants (for closing tabs). */
export function collectNodeIds(
  tree: IdeTreeNode[],
  nodeId: string
): string[] {
  const find = (nodes: IdeTreeNode[]): IdeTreeNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return node
      if (node.children) {
        const hit = find(node.children)
        if (hit) return hit
      }
    }
    return null
  }

  const root = find(tree)
  if (!root) return []

  const ids: string[] = []
  const walk = (node: IdeTreeNode) => {
    ids.push(node.id)
    node.children?.forEach(walk)
  }
  walk(root)
  return ids
}

export function tabFromCatalog(
  catalog: Map<string, IdeTab>,
  nodeId: string,
  tree: IdeTreeNode[],
  preview: boolean
): IdeTab | null {
  const existing = catalog.get(nodeId)
  if (existing) {
    return { ...existing, preview }
  }
  const node = findTreeNode(tree, nodeId)
  if (!node || !isFileNode(node)) return null
  return {
    id: nodeId,
    title: node.name,
    language: languageFromFileName(node.name),
    value: "",
    preview,
  }
}

function cloneNodeDeep(node: IdeTreeNode, newId: string): IdeTreeNode {
  const name = newId.includes("/")
    ? newId.slice(newId.lastIndexOf("/") + 1)
    : newId
  if (node.children) {
    return {
      id: newId,
      name,
      children: node.children.map((c) => {
        const childName = c.name
        const childId = `${newId}/${childName}`
        return cloneNodeDeep(c, childId)
      }),
    }
  }
  return { id: newId, name }
}

function reassignIds(node: IdeTreeNode, newId: string): IdeTreeNode {
  return cloneNodeDeep(node, newId)
}

export function renameNodeInTree(
  tree: IdeTreeNode[],
  nodeId: string,
  rawName: string
): { tree: IdeTreeNode[]; oldId: string; newId: string } | null {
  const name = sanitizeName(rawName)
  if (!name) return null

  const slash = nodeId.lastIndexOf("/")
  const parentPath = slash > 0 ? nodeId.slice(0, slash) : null
  const newId = parentPath ? `${parentPath}/${name}` : name
  if (newId === nodeId) return { tree, oldId: nodeId, newId }
  if (nodeExists(tree, newId)) return null

  const source = findTreeNode(tree, nodeId)
  if (!source) return null

  let without = removeNodeFromTree(tree, nodeId)
  if (!without) return null

  const renamed = reassignIds(source, newId)
  // insertChild sorts only the target sibling list
  without = insertChild(without, parentPath, renamed)
  return { tree: without, oldId: nodeId, newId }
}

export function duplicateNodeInTree(
  tree: IdeTreeNode[],
  nodeId: string
): { tree: IdeTreeNode[]; newId: string; node: IdeTreeNode } | null {
  const source = findTreeNode(tree, nodeId)
  if (!source) return null

  const slash = nodeId.lastIndexOf("/")
  const parentPath = slash > 0 ? nodeId.slice(0, slash) : null
  const baseName = source.name
  let n = 1
  let newName = `${baseName} copy`
  let newId = parentPath ? `${parentPath}/${newName}` : newName
  while (nodeExists(tree, newId)) {
    n += 1
    newName = `${baseName} copy ${n}`
    newId = parentPath ? `${parentPath}/${newName}` : newName
  }

  const cloned = reassignIds(source, newId)
  return {
    tree: insertChild(tree, parentPath, cloned),
    newId,
    node: cloned,
  }
}

export function pasteNodeInTree(
  tree: IdeTreeNode[],
  source: IdeTreeNode,
  parentId: string | null,
  mode: "copy" | "cut"
): { tree: IdeTreeNode[]; newId: string } | null {
  let working = tree
  if (mode === "cut") {
    const removed = removeNodeFromTree(working, source.id)
    if (!removed) return null
    working = removed
  }

  const baseName = source.name
  let newName = baseName
  let newId = parentId ? `${parentId}/${newName}` : newName
  let n = 1
  while (nodeExists(working, newId)) {
    n += 1
    newName = `${baseName} copy${n > 1 ? ` ${n}` : ""}`
    newId = parentId ? `${parentId}/${newName}` : newName
  }

  const cloned = reassignIds(source, newId)
  return {
    tree: insertChild(working, parentId, cloned),
    newId,
  }
}

/** Collect all file tabs under a cloned subtree for catalog seeding. */
export function collectFileTabs(
  node: IdeTreeNode,
  catalog: Map<string, IdeTab>,
  oldRootId: string,
  newRootId: string
): IdeTab[] {
  const tabs: IdeTab[] = []
  const walk = (n: IdeTreeNode, oldId: string) => {
    if (n.children) {
      for (const c of n.children) {
        const oldChildId = `${oldId}/${c.name}`
        walk(c, oldChildId)
      }
      return
    }
    const oldTab = catalog.get(oldId)
    tabs.push({
      id: n.id,
      title: n.name,
      language: languageFromFileName(n.name),
      value: oldTab?.value ?? "",
      dirty: false,
      preview: false,
    })
  }
  // Map root
  if (!node.children) {
    const oldTab = catalog.get(oldRootId)
    tabs.push({
      id: newRootId,
      title: node.name,
      language: languageFromFileName(node.name),
      value: oldTab?.value ?? "",
    })
  } else {
    walk(node, oldRootId)
  }
  return tabs
}

