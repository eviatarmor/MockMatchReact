/**
 * Shared file sanitization + host sync helpers for sandbox backends.
 */
import { mkdir, writeFile, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { env } from "../../config/env.js"
import { safeSessionId } from "./ids.js"

const MAX_FILE_BYTES = 1_500_000
const MAX_FILES = 200
const MAX_TOTAL_BYTES = 4_000_000

const DEFAULT_WORKSPACE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../infra/sandbox/workspace"
)

export function workspaceRoot(): string {
  return env.SANDBOX_WORKSPACE_DIR || DEFAULT_WORKSPACE
}

export function sessionHostDir(sessionId: string): string {
  return path.join(workspaceRoot(), "sessions", safeSessionId(sessionId))
}

function safeRelPath(raw: string): string | null {
  const p = raw.replace(/\\/g, "/").replace(/^\/+/, "").trim()
  if (!p || p.length > 512) return null
  if (p.includes("\0") || p.includes("..")) return null
  if (p.startsWith("/") || /^[a-zA-Z]:/.test(p)) return null
  return p
}

export function sanitizeSandboxFiles(
  raw: unknown
): { files: Record<string, string>; error?: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { files: {}, error: "Missing files" }
  }
  const entries = Object.entries(raw as Record<string, unknown>)
  if (entries.length === 0) return { files: {}, error: "No files to run" }
  if (entries.length > MAX_FILES) {
    return { files: {}, error: `Too many files (max ${MAX_FILES})` }
  }

  const files: Record<string, string> = {}
  let total = 0
  for (const [key, val] of entries) {
    const rel = safeRelPath(key)
    if (!rel) continue
    if (typeof val !== "string") continue
    if (val.length > MAX_FILE_BYTES) {
      return { files: {}, error: `File too large: ${rel}` }
    }
    total += val.length
    if (total > MAX_TOTAL_BYTES) {
      return { files: {}, error: "Workspace too large to sync" }
    }
    files[rel] = val
  }
  if (Object.keys(files).length === 0) {
    return { files: {}, error: "No valid files" }
  }
  return { files }
}

export async function syncFilesToHost(
  sessionId: string,
  files: Record<string, string>
): Promise<string> {
  const hostDir = sessionHostDir(sessionId)
  await mkdir(hostDir, { recursive: true })
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(hostDir, ...rel.split("/"))
    await mkdir(path.dirname(abs), { recursive: true })
    await writeFile(abs, content, "utf8")
  }
  return hostDir
}

/** Best-effort wipe of host session dir (prod backends should wipe guest disk). */
export async function wipeSessionHostDir(sessionId: string): Promise<void> {
  const hostDir = sessionHostDir(sessionId)
  try {
    await rm(hostDir, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

export { safeRelPath }
