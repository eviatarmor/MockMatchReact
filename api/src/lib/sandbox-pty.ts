/**
 * Sandbox PTY facade — delegates to multi-tenant sandbox module.
 */
import type { CollabEffectiveRole } from "@mockmatch/schemas"
import {
  sandboxCloseAllPty,
  sandboxClosePty,
  sandboxOpenPty,
  sandboxWritePty,
} from "../modules/sandbox/client.js"
import { syncFilesToHost } from "../modules/sandbox/files.js"

export type SandboxPtyHandlers = {
  onData: (chunk: string) => void
  onExit: (code: number | null) => void
  onError: (message: string) => void
}

/** Process-local set of open PTYs (for fs-watch refcount). */
const openKeys = new Set<string>()

export function ptySessionKey(documentId: string, userId: string): string {
  return `${documentId}:${userId}`
}

export function hasPtySession(documentId: string, userId: string): boolean {
  return openKeys.has(ptySessionKey(documentId, userId))
}

export function closePtySession(documentId: string, userId: string): void {
  openKeys.delete(ptySessionKey(documentId, userId))
  sandboxClosePty(documentId, userId)
}

export function closeAllPtyForDocument(documentId: string): void {
  for (const key of [...openKeys]) {
    if (key.startsWith(`${documentId}:`)) openKeys.delete(key)
  }
  sandboxCloseAllPty(documentId)
}

export async function openPtySession(opts: {
  documentId: string
  userId: string
  role?: CollabEffectiveRole
  files?: Record<string, string>
  cols?: number
  rows?: number
  handlers: SandboxPtyHandlers
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = ptySessionKey(opts.documentId, opts.userId)
  const result = await sandboxOpenPty({
    sessionId: opts.documentId,
    userId: opts.userId,
    role: opts.role ?? "owner",
    files: opts.files,
    cols: opts.cols,
    rows: opts.rows,
    handlers: {
      onData: opts.handlers.onData,
      onError: opts.handlers.onError,
      onExit: (code) => {
        openKeys.delete(key)
        opts.handlers.onExit(code)
      },
    },
  })
  if (result.ok) openKeys.add(key)
  else openKeys.delete(key)
  return result
}

export function writePtySession(
  documentId: string,
  userId: string,
  data: string
): boolean {
  return sandboxWritePty(documentId, userId, data)
}

export function resizePtySession(
  _documentId: string,
  _userId: string,
  _cols: number,
  _rows: number
): boolean {
  return true
}

export async function syncPtyWorkspace(
  documentId: string,
  files: Record<string, string>
): Promise<void> {
  if (Object.keys(files).length === 0) return
  await syncFilesToHost(documentId, files)
}
