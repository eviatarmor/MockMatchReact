/**
 * Read/watch session host directory (bind-mounted as guest /workspace).
 * Used to mirror terminal create/edit (touch, echo, …) back into the IDE.
 */
import { watch, type FSWatcher } from "node:fs"
import { mkdir, readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"
import { logger } from "../../lib/logger.js"
import { sessionHostDir } from "./files.js"

const MAX_FILE_BYTES = 1_500_000
const MAX_FILES = 200
const MAX_TOTAL_BYTES = 4_000_000
const DEBOUNCE_MS = 350

const SKIP_DIR = new Set([
  "node_modules",
  ".git",
  "__pycache__",
  ".venv",
  "venv",
  "dist",
  "build",
  ".cache",
])

export type SessionFsSnapshot = {
  files: Record<string, string>
  /** sha256 of sorted path+content for change detection */
  hash: string
}

type WatchRec = {
  sessionId: string
  hostDir: string
  watcher: FSWatcher | null
  timer: ReturnType<typeof setTimeout> | null
  poll: ReturnType<typeof setInterval> | null
  lastHash: string
  onChange: (snap: SessionFsSnapshot) => void
  refs: number
}

const watches = new Map<string, WatchRec>()

function hashSnapshot(files: Record<string, string>): string {
  const h = createHash("sha256")
  for (const p of Object.keys(files).sort()) {
    h.update(p)
    h.update("\0")
    h.update(files[p]!)
    h.update("\0")
  }
  return h.digest("hex")
}

async function walkDir(
  absDir: string,
  relBase: string,
  out: Record<string, string>,
  totals: { files: number; bytes: number }
): Promise<void> {
  let entries
  try {
    entries = await readdir(absDir, { withFileTypes: true })
  } catch {
    return
  }
  for (const ent of entries) {
    if (totals.files >= MAX_FILES || totals.bytes >= MAX_TOTAL_BYTES) return
    const name = ent.name
    if (name === "." || name === ".." || name.startsWith(".sandbox")) continue
    const rel = relBase ? `${relBase}/${name}` : name
    const abs = path.join(absDir, name)
    if (ent.isDirectory()) {
      if (SKIP_DIR.has(name)) continue
      await walkDir(abs, rel, out, totals)
      continue
    }
    if (!ent.isFile()) continue
    try {
      const st = await stat(abs)
      if (st.size > MAX_FILE_BYTES) continue
      if (totals.bytes + st.size > MAX_TOTAL_BYTES) continue
      // Skip likely-binary (NUL in first 8k)
      const buf = await readFile(abs)
      if (buf.includes(0)) continue
      const text = buf.toString("utf8")
      out[rel.replace(/\\/g, "/")] = text
      totals.files += 1
      totals.bytes += text.length
    } catch {
      // ignore unreadable
    }
  }
}

export async function readSessionFs(
  sessionId: string
): Promise<SessionFsSnapshot> {
  const hostDir = sessionHostDir(sessionId)
  const files: Record<string, string> = {}
  await walkDir(hostDir, "", files, { files: 0, bytes: 0 })
  return { files, hash: hashSnapshot(files) }
}

async function emitIfChanged(rec: WatchRec): Promise<void> {
  try {
    const snap = await readSessionFs(rec.sessionId)
    if (snap.hash === rec.lastHash) return
    rec.lastHash = snap.hash
    rec.onChange(snap)
  } catch (err) {
    logger.warn({ err, sessionId: rec.sessionId }, "sandbox fs read failed")
  }
}

function scheduleEmit(rec: WatchRec): void {
  if (rec.timer) clearTimeout(rec.timer)
  rec.timer = setTimeout(() => {
    rec.timer = null
    void emitIfChanged(rec)
  }, DEBOUNCE_MS)
}

/**
 * Watch session host dir. Multiple PTY peers share one watcher (refcount).
 * `onChange` should fan out to the collab room.
 */
export function retainSessionFsWatch(
  sessionId: string,
  onChange: (snap: SessionFsSnapshot) => void
): void {
  const existing = watches.get(sessionId)
  if (existing) {
    existing.refs += 1
    existing.onChange = onChange
    void emitIfChanged(existing)
    return
  }

  const hostDir = sessionHostDir(sessionId)
  const rec: WatchRec = {
    sessionId,
    hostDir,
    watcher: null,
    timer: null,
    poll: null,
    lastHash: "",
    onChange,
    refs: 1,
  }

  void mkdir(hostDir, { recursive: true }).then(() => {
    try {
      rec.watcher = watch(
        hostDir,
        { recursive: true },
        () => scheduleEmit(rec)
      )
      rec.watcher.on("error", (err) => {
        logger.warn({ err, sessionId }, "sandbox fs.watch error")
      })
    } catch (err) {
      logger.warn(
        { err, sessionId, hostDir },
        "sandbox fs.watch failed — falling back to poll"
      )
      rec.poll = setInterval(() => scheduleEmit(rec), 1000)
    }
    void emitIfChanged(rec)
  })

  // Always poll as well (Docker Desktop bind mounts often miss inotify events)
  rec.poll = setInterval(() => scheduleEmit(rec), 1000)

  watches.set(sessionId, rec)
  logger.info({ sessionId, hostDir }, "sandbox fs watch started")
}

export function releaseSessionFsWatch(sessionId: string): void {
  const rec = watches.get(sessionId)
  if (!rec) return
  rec.refs -= 1
  if (rec.refs > 0) return
  if (rec.timer) clearTimeout(rec.timer)
  if (rec.poll) clearInterval(rec.poll)
  try {
    rec.watcher?.close()
  } catch {
    // ignore
  }
  watches.delete(sessionId)
  logger.info({ sessionId }, "sandbox fs watch stopped")
}

/** One-shot read + optional notify if changed (e.g. after Run). */
export async function pullSessionFsIfChanged(
  sessionId: string,
  onChange: (snap: SessionFsSnapshot) => void,
  prevHash = ""
): Promise<string> {
  const snap = await readSessionFs(sessionId)
  if (snap.hash !== prevHash) onChange(snap)
  const rec = watches.get(sessionId)
  if (rec) rec.lastHash = snap.hash
  return snap.hash
}
