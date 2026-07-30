/**
 * Long-lived interactive shell in the gVisor sandbox (SSH-like).
 *
 * Host has no guest TTY via `docker exec -t` on all platforms, so we spawn
 * Python's `pty.spawn` *inside* the container under `docker exec -i`.
 * Each collab peer gets their own session (key = documentId:userId).
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process"
import { mkdir } from "node:fs/promises"

import { env } from "../config/env.js"
import { logger } from "./logger.js"
import {
  resolveGuestSessionDir,
  syncFilesToHost,
} from "./sandbox-runner.js"

export type SandboxPtyHandlers = {
  onData: (chunk: string) => void
  onExit: (code: number | null) => void
  onError: (message: string) => void
}

type PtyRecord = {
  key: string
  proc: ChildProcessWithoutNullStreams
  documentId: string
  userId: string
}

const sessions = new Map<string, PtyRecord>()

export function ptySessionKey(documentId: string, userId: string): string {
  return `${documentId}:${userId}`
}

export function hasPtySession(documentId: string, userId: string): boolean {
  return sessions.has(ptySessionKey(documentId, userId))
}

export function closePtySession(documentId: string, userId: string): void {
  const key = ptySessionKey(documentId, userId)
  const rec = sessions.get(key)
  if (!rec) return
  sessions.delete(key)
  try {
    rec.proc.stdin.end()
  } catch {
    // ignore
  }
  try {
    rec.proc.kill("SIGKILL")
  } catch {
    // ignore
  }
}

export function closeAllPtyForDocument(documentId: string): void {
  for (const [key, rec] of [...sessions]) {
    if (rec.documentId === documentId) {
      closePtySession(documentId, rec.userId)
      void key
    }
  }
}

/**
 * Open (or replace) an interactive bash PTY for this peer in the session dir.
 */
export async function openPtySession(opts: {
  documentId: string
  userId: string
  files?: Record<string, string>
  cols?: number
  rows?: number
  handlers: SandboxPtyHandlers
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const container = env.SANDBOX_CONTAINER
  if (!container) {
    return { ok: false, error: "Sandbox disabled (SANDBOX_CONTAINER empty)." }
  }

  // Replace existing shell for this peer
  closePtySession(opts.documentId, opts.userId)

  let guestDir: string
  try {
    if (opts.files && Object.keys(opts.files).length > 0) {
      ;({ guestDir } = await syncFilesToHost(opts.documentId, opts.files))
    } else {
      const dirs = resolveGuestSessionDir(opts.documentId)
      await mkdir(dirs.hostDir, { recursive: true })
      guestDir = dirs.guestDir
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to sync workspace: ${message}` }
  }

  const cols = Math.min(300, Math.max(20, Math.floor(opts.cols ?? 80)))
  const rows = Math.min(100, Math.max(5, Math.floor(opts.rows ?? 24)))

  // Python allocates a real PTY inside the guest (works without docker -t).
  const py = [
    "import os, pty, sys",
    `os.environ['TERM'] = 'xterm-256color'`,
    `os.environ['COLUMNS'] = '${cols}'`,
    `os.environ['LINES'] = '${rows}'`,
    "sys.stdout.reconfigure(write_through=True) if hasattr(sys.stdout,'reconfigure') else None",
    "pty.spawn(['/bin/bash', '-l'])",
  ].join(";")

  const proc = spawn(
    "docker",
    [
      "exec",
      "-i",
      "-u",
      "coder",
      "-w",
      guestDir,
      "-e",
      "TERM=xterm-256color",
      "-e",
      `COLUMNS=${cols}`,
      "-e",
      `LINES=${rows}`,
      container,
      "python3",
      "-u",
      "-c",
      py,
    ],
    {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    }
  ) as ChildProcessWithoutNullStreams

  const key = ptySessionKey(opts.documentId, opts.userId)
  const rec: PtyRecord = {
    key,
    proc,
    documentId: opts.documentId,
    userId: opts.userId,
  }
  sessions.set(key, rec)

  const onChunk = (buf: Buffer) => {
    if (!sessions.has(key)) return
    opts.handlers.onData(buf.toString("utf8"))
  }

  proc.stdout.on("data", onChunk)
  proc.stderr.on("data", onChunk)

  proc.on("error", (err) => {
    sessions.delete(key)
    opts.handlers.onError(
      `Failed to start sandbox shell: ${err.message}. Is mockmatch-sandbox up?`
    )
    opts.handlers.onExit(null)
  })

  proc.on("close", (code) => {
    if (sessions.get(key) === rec) sessions.delete(key)
    opts.handlers.onExit(code)
  })

  logger.info(
    { documentId: opts.documentId, userId: opts.userId, guestDir },
    "sandbox pty opened"
  )

  return { ok: true }
}

export function writePtySession(
  documentId: string,
  userId: string,
  data: string
): boolean {
  const rec = sessions.get(ptySessionKey(documentId, userId))
  if (!rec || !rec.proc.stdin.writable) return false
  try {
    rec.proc.stdin.write(data)
    return true
  } catch {
    return false
  }
}

/**
 * Resize is best-effort only — outer docker has no host PTY ioctl.
 * We avoid injecting `stty` into the shell (would type garbage into stdin).
 * Size is applied on next open via COLUMNS/LINES.
 */
export function resizePtySession(
  _documentId: string,
  _userId: string,
  _cols: number,
  _rows: number
): boolean {
  return true
}

/** Re-sync editor files under a live PTY (does not restart the shell). */
export async function syncPtyWorkspace(
  documentId: string,
  files: Record<string, string>
): Promise<void> {
  if (Object.keys(files).length === 0) return
  await syncFilesToHost(documentId, files)
}
