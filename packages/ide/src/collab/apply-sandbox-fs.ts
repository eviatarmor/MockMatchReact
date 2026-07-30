import * as Y from "yjs"
import {
  COLLAB_Y_ROOT,
  jsonToY,
  mergeJsonIntoY,
} from "@mockmatch/collab"

import type { IdeTreeNode } from "../types"
import { languageFromFileName } from "../language-from-filename"
import { ensureIdeFileYText, getIdeFileYText } from "./ide-collab-ydoc"

/** Origin for terminal/host FS → IDE applies (do not re-broadcast as local edits). */
export const SANDBOX_FS_ORIGIN = "sandbox-fs"

/**
 * Apply a full sandbox host snapshot into the collab Y.Doc:
 * - create/update Y.Text contents
 * - remove files missing from snapshot
 * - replace tree structure
 */
export function applySandboxFsToYDoc(
  ydoc: Y.Doc,
  files: Record<string, string>,
  tree: IdeTreeNode[]
): void {
  ydoc.transact(() => {
    const root = ydoc.getMap(COLLAB_Y_ROOT)
    let document = root.get("document")
    if (!(document instanceof Y.Map)) {
      document = new Y.Map()
      root.set("document", document)
    }
    const doc = document as Y.Map<unknown>

    let filesMap = doc.get("files")
    if (!(filesMap instanceof Y.Map)) {
      filesMap = new Y.Map()
      doc.set("files", filesMap)
    }
    const fm = filesMap as Y.Map<unknown>

    const keep = new Set(Object.keys(files))

    // Remove deleted files
    const toDelete: string[] = []
    fm.forEach((_, key) => {
      if (!keep.has(key)) toDelete.push(key)
    })
    for (const key of toDelete) fm.delete(key)

    // Upsert file contents
    for (const [path, content] of Object.entries(files)) {
      const name = path.includes("/")
        ? path.slice(path.lastIndexOf("/") + 1)
        : path
      let ytext = getIdeFileYText(ydoc, path)
      if (!ytext) {
        ytext = ensureIdeFileYText(
          ydoc,
          path,
          {
            language: languageFromFileName(name),
            content: "",
          },
          SANDBOX_FS_ORIGIN
        )
      }
      const cur = ytext.toString()
      if (cur !== content) {
        // Replace entire text (terminal is source of truth for this path)
        if (cur.length > 0) ytext.delete(0, cur.length)
        if (content.length > 0) ytext.insert(0, content)
      }
      // language on entry
      const entry = fm.get(path)
      if (entry instanceof Y.Map && !entry.get("language")) {
        entry.set("language", languageFromFileName(name))
      }
    }

    mergeJsonIntoY(doc, "tree", tree)
    if (!root.get("title")) root.set("title", "workspace")
    if (!root.get("templateId")) root.set("templateId", "workspace")
    if (!root.get("style")) root.set("style", jsonToY({}))
  }, SANDBOX_FS_ORIGIN)
}
