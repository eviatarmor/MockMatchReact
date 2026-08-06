import * as Y from "yjs"
import { jsonToY, mergeJsonIntoY, yToJson } from "./json-y"

export type CollabYSnapshot = {
  title: string
  templateId: string
  style: Record<string, unknown>
  document: unknown
}

export const Y_ORIGIN_REMOTE = "remote"
export const Y_ORIGIN_LOCAL = "local"

/** Root shared map name inside the collab Y.Doc. */
export const COLLAB_Y_ROOT = "root"

export function createCollabYDoc(): Y.Doc {
  return new Y.Doc()
}

export function getCollabRoot(ydoc: Y.Doc): Y.Map<unknown> {
  return ydoc.getMap(COLLAB_Y_ROOT)
}

/**
 * Seed / replace entire collab state from a JSON snapshot.
 * Pass `origin` — use {@link Y_ORIGIN_REMOTE} on join so peers are not re-broadcast.
 */
export function seedCollabYDoc(
  ydoc: Y.Doc,
  snap: CollabYSnapshot,
  origin: unknown = Y_ORIGIN_LOCAL
): void {
  ydoc.transact(() => {
    const root = getCollabRoot(ydoc)
    // Clear previous keys
    const keys: string[] = []
    root.forEach((_, k) => keys.push(k))
    for (const k of keys) root.delete(k)

    root.set("title", snap.title)
    root.set("templateId", snap.templateId)
    root.set("style", jsonToY(snap.style ?? {}))
    root.set("document", jsonToY(snap.document ?? {}))
  }, origin)
}

export function materializeCollabYDoc(ydoc: Y.Doc): CollabYSnapshot {
  const root = getCollabRoot(ydoc)
  const styleRaw = yToJson(root.get("style"))
  return {
    title: String(root.get("title") ?? ""),
    templateId: String(root.get("templateId") ?? "modern"),
    style:
      styleRaw && typeof styleRaw === "object" && !Array.isArray(styleRaw)
        ? (styleRaw as Record<string, unknown>)
        : {},
    document: yToJson(root.get("document")) ?? {},
  }
}

export function setCollabTitle(ydoc: Y.Doc, title: string): void {
  ydoc.transact(() => {
    getCollabRoot(ydoc).set("title", title)
  }, Y_ORIGIN_LOCAL)
}

export function setCollabTemplateId(ydoc: Y.Doc, templateId: string): void {
  ydoc.transact(() => {
    getCollabRoot(ydoc).set("templateId", templateId)
  }, Y_ORIGIN_LOCAL)
}

export function setCollabStyle(
  ydoc: Y.Doc,
  style: Record<string, unknown>
): void {
  ydoc.transact(() => {
    const root = getCollabRoot(ydoc)
    const existing = root.get("style")
    if (existing instanceof Y.Map) {
      mergeJsonIntoY(root, "style", style)
    } else {
      root.set("style", jsonToY(style))
    }
  }, Y_ORIGIN_LOCAL)
}

/**
 * Merge a full document JSON into the Y tree (structure-preserving).
 * Default origin is {@link Y_ORIGIN_LOCAL} so {@link createCollabDocumentUndoManager}
 * can track host edits; pass {@link Y_ORIGIN_REMOTE} for untracked system writes.
 */
export function setCollabDocument(
  ydoc: Y.Doc,
  document: unknown,
  origin: unknown = Y_ORIGIN_LOCAL
): void {
  ydoc.transact(() => {
    const root = getCollabRoot(ydoc)
    const existing = root.get("document")
    if (existing instanceof Y.Map || existing instanceof Y.Array) {
      mergeJsonIntoY(root, "document", document)
    } else {
      root.set("document", jsonToY(document))
    }
  }, origin)
}

/**
 * Undo/redo for the collab root map (local origin only).
 * Remote {@link applyRemoteYUpdate} uses {@link Y_ORIGIN_REMOTE} and is not tracked —
 * so peer merges do not wipe or pollute the local undo stack.
 */
export function createCollabDocumentUndoManager(
  ydoc: Y.Doc,
  opts?: { captureTimeout?: number }
): Y.UndoManager {
  return new Y.UndoManager([getCollabRoot(ydoc)], {
    trackedOrigins: new Set([Y_ORIGIN_LOCAL]),
    captureTimeout: opts?.captureTimeout ?? 300,
  })
}

/** Apply a full snapshot (history restore / AI) into the Y.Doc. */
export function applyCollabYSnapshot(
  ydoc: Y.Doc,
  snap: CollabYSnapshot
): void {
  ydoc.transact(() => {
    const root = getCollabRoot(ydoc)
    root.set("title", snap.title)
    root.set("templateId", snap.templateId)
    mergeJsonIntoY(root, "style", snap.style ?? {})
    mergeJsonIntoY(root, "document", snap.document ?? {})
  }, Y_ORIGIN_LOCAL)
}

export function encodeYUpdate(update: Uint8Array): string {
  // base64url-safe for JSON WS frames
  let binary = ""
  for (let i = 0; i < update.length; i++) {
    binary += String.fromCharCode(update[i]!)
  }
  return btoa(binary)
}

export function decodeYUpdate(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i)
  }
  return out
}

export function applyRemoteYUpdate(ydoc: Y.Doc, update: Uint8Array): void {
  Y.applyUpdate(ydoc, update, Y_ORIGIN_REMOTE)
}

export function encodeFullYState(ydoc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(ydoc)
}
