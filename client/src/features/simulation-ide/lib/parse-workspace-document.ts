import type { IdeWorkspaceDocument, IdeTreeNode } from "@mockmatch/ide"

function isTreeNode(v: unknown): v is IdeTreeNode {
  if (!v || typeof v !== "object") return false
  const n = v as Record<string, unknown>
  return typeof n.id === "string" && typeof n.name === "string"
}

function parseTree(raw: unknown): IdeTreeNode[] {
  if (!Array.isArray(raw)) return []
  const out: IdeTreeNode[] = []
  for (const item of raw) {
    if (!isTreeNode(item)) continue
    const node: IdeTreeNode = { id: item.id, name: item.name }
    if (Array.isArray(item.children)) {
      node.children = parseTree(item.children)
    }
    out.push(node)
  }
  return out
}

export function parseWorkspaceDocument(raw: unknown): IdeWorkspaceDocument {
  if (!raw || typeof raw !== "object") {
    return { tree: [], files: {} }
  }
  const doc = raw as Record<string, unknown>
  const files: IdeWorkspaceDocument["files"] = {}
  if (doc.files && typeof doc.files === "object" && !Array.isArray(doc.files)) {
    for (const [path, entry] of Object.entries(
      doc.files as Record<string, unknown>
    )) {
      if (!entry || typeof entry !== "object") continue
      const e = entry as Record<string, unknown>
      files[path] = {
        language: typeof e.language === "string" ? e.language : undefined,
        content: typeof e.content === "string" ? e.content : "",
      }
    }
  }
  return {
    tree: parseTree(doc.tree),
    files,
  }
}

/** Build durable document blob from simulation seed tree + tabs. */
export function documentFromTabs(
  tree: IdeTreeNode[],
  tabs: Array<{
    id: string
    language?: string
    value: string
  }>
): IdeWorkspaceDocument {
  const files: IdeWorkspaceDocument["files"] = {}
  for (const tab of tabs) {
    files[tab.id] = {
      language: tab.language,
      content: tab.value,
    }
  }
  return { tree, files }
}
