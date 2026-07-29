import * as Y from "yjs"
import {
  COLLAB_Y_ROOT,
  Y_ORIGIN_LOCAL,
  jsonToY,
  mergeJsonIntoY,
  yToJson,
} from "@mockmatch/collab"

import type { IdeTreeNode } from "../types"
import type { IdeWorkspaceDocument, IdeWorkspaceFileEntry } from "./types"

export type IdeCollabYSnapshot = {
  title: string
  templateId: string
  style: Record<string, unknown>
  document: IdeWorkspaceDocument
}

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

function parseFiles(raw: unknown): Record<string, IdeWorkspaceFileEntry> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out: Record<string, IdeWorkspaceFileEntry> = {}
  for (const [path, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue
    const e = entry as Record<string, unknown>
    const content =
      typeof e.content === "string"
        ? e.content
        : typeof e.content === "undefined" && typeof e === "string"
          ? String(e)
          : String(e.content ?? "")
    out[path] = {
      language: typeof e.language === "string" ? e.language : undefined,
      content,
    }
  }
  return out
}

export function materializeIdeWorkspace(ydoc: Y.Doc): IdeCollabYSnapshot {
  const root = ydoc.getMap(COLLAB_Y_ROOT)
  const styleRaw = yToJson(root.get("style"))
  const docRaw = yToJson(root.get("document")) as Record<string, unknown> | null
  return {
    title: String(root.get("title") ?? ""),
    templateId: String(root.get("templateId") ?? "workspace"),
    style:
      styleRaw && typeof styleRaw === "object" && !Array.isArray(styleRaw)
        ? (styleRaw as Record<string, unknown>)
        : {},
    document: {
      tree: parseTree(docRaw?.tree),
      files: parseFiles(docRaw?.files),
    },
  }
}

/** Get or create Y.Text for a file path under document.files[path].content */
export function getIdeFileYText(
  ydoc: Y.Doc,
  path: string
): Y.Text | null {
  const root = ydoc.getMap(COLLAB_Y_ROOT)
  const document = root.get("document")
  if (!(document instanceof Y.Map)) return null
  const files = document.get("files")
  if (!(files instanceof Y.Map)) return null
  let entry = files.get(path)
  if (!(entry instanceof Y.Map)) {
    return null
  }
  let content = entry.get("content")
  if (content instanceof Y.Text) return content
  if (typeof content === "string") {
    // Upgrade plain string to Y.Text once
    ydoc.transact(() => {
      const t = new Y.Text()
      if (content) t.insert(0, content as string)
      entry.set("content", t)
    }, Y_ORIGIN_LOCAL)
    content = entry.get("content")
    return content instanceof Y.Text ? content : null
  }
  return null
}

/**
 * Ensure file entry exists (for new files). Creates Y.Map + Y.Text under files.
 */
export function ensureIdeFileYText(
  ydoc: Y.Doc,
  path: string,
  initial?: { language?: string; content?: string }
): Y.Text {
  const root = ydoc.getMap(COLLAB_Y_ROOT)
  ydoc.transact(() => {
    const rawDoc = root.get("document")
    const document: Y.Map<unknown> =
      rawDoc instanceof Y.Map ? rawDoc : new Y.Map()
    if (!(rawDoc instanceof Y.Map)) {
      root.set("document", document)
      document.set("tree", jsonToY([]))
      document.set("files", new Y.Map())
    }
    const rawFiles = document.get("files")
    const files: Y.Map<unknown> =
      rawFiles instanceof Y.Map ? rawFiles : new Y.Map()
    if (!(rawFiles instanceof Y.Map)) {
      document.set("files", files)
    }
    const rawEntry = files.get(path)
    if (!(rawEntry instanceof Y.Map)) {
      const entry = new Y.Map<unknown>()
      files.set(path, entry)
      if (initial?.language) entry.set("language", initial.language)
      const t = new Y.Text()
      if (initial?.content) t.insert(0, initial.content)
      entry.set("content", t)
    } else if (!(rawEntry.get("content") instanceof Y.Text)) {
      const t = new Y.Text()
      const prev = rawEntry.get("content")
      if (typeof prev === "string" && prev) t.insert(0, prev)
      else if (initial?.content) t.insert(0, initial.content)
      rawEntry.set("content", t)
    }
  }, Y_ORIGIN_LOCAL)

  const text = getIdeFileYText(ydoc, path)
  if (!text) {
    throw new Error(`Failed to ensure Y.Text for ${path}`)
  }
  return text
}

export function setIdeWorkspaceTree(
  ydoc: Y.Doc,
  tree: IdeTreeNode[]
): void {
  ydoc.transact(() => {
    const root = ydoc.getMap(COLLAB_Y_ROOT)
    const rawDoc = root.get("document")
    const document: Y.Map<unknown> =
      rawDoc instanceof Y.Map ? rawDoc : new Y.Map()
    if (!(rawDoc instanceof Y.Map)) {
      root.set("document", document)
      document.set("files", new Y.Map())
    }
    mergeJsonIntoY(document, "tree", tree)
  }, Y_ORIGIN_LOCAL)
}

export function setIdeWorkspaceDocument(
  ydoc: Y.Doc,
  document: IdeWorkspaceDocument
): void {
  ydoc.transact(() => {
    const root = ydoc.getMap(COLLAB_Y_ROOT)
    const existing = root.get("document")
    if (existing instanceof Y.Map) {
      mergeJsonIntoY(root, "document", document)
    } else {
      root.set("document", jsonToY(document))
    }
  }, Y_ORIGIN_LOCAL)
}

export function setIdeWorkspaceTitle(ydoc: Y.Doc, title: string): void {
  ydoc.transact(() => {
    ydoc.getMap(COLLAB_Y_ROOT).set("title", title)
  }, Y_ORIGIN_LOCAL)
}
