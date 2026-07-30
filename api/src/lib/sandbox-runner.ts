/**
 * Local gVisor sandbox runner for collab WS.
 * Host writes files into the bind-mounted workspace, then `docker exec`.
 *
 * Stateless API rule: no long-lived session state in this module beyond
 * in-flight AbortControllers (per-room lock). Multi-replica: only the
 * receiving pod runs docker; output fans out via Redis pub/sub.
 */
import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomBytes } from "node:crypto"

import { env } from "../config/env.js"
import { logger } from "./logger.js"

const DEFAULT_WORKSPACE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../infra/sandbox/workspace"
)

const MAX_FILE_BYTES = 1_500_000
const MAX_FILES = 200
const MAX_TOTAL_BYTES = 4_000_000
const RUN_TIMEOUT_MS = 30_000

export type SandboxMode = "run" | "tests"

export type SandboxRunRequest = {
  sessionId: string
  mode: SandboxMode
  entryPath?: string
  /** path → file content (already sanitized). */
  files: Record<string, string>
}

export type SandboxRunResult = {
  runId: string
  exitCode: number | null
  error?: string
  command: string
}

/** In-process per-room lock (one active one-shot run per workspace). */
const activeRuns = new Map<string, AbortController>()

export function isSandboxRunActive(sessionId: string): boolean {
  return activeRuns.has(sessionId)
}

export function abortSandboxRun(sessionId: string): void {
  const c = activeRuns.get(sessionId)
  if (c) {
    c.abort()
    activeRuns.delete(sessionId)
  }
}

function safeRelPath(raw: string): string | null {
  const p = raw.replace(/\\/g, "/").replace(/^\/+/, "").trim()
  if (!p || p.length > 512) return null
  if (p.includes("\0") || p.includes("..")) return null
  if (p.startsWith("/") || /^[a-zA-Z]:/.test(p)) return null
  return p
}

/**
 * Validate + clamp client-supplied files map.
 */
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
      return {
        files: {},
        error: `File too large: ${rel}`,
      }
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

/**
 * Write workspace files into the bind mount for a session.
 * Does **not** wipe the tree (PTY shells may be cd'd into it).
 */
export async function syncFilesToHost(
  sessionId: string,
  files: Record<string, string>
): Promise<{ hostDir: string; guestDir: string }> {
  const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "session"
  const hostRoot = env.SANDBOX_WORKSPACE_DIR || DEFAULT_WORKSPACE
  const hostDir = path.join(hostRoot, "sessions", safeId)
  await mkdir(hostDir, { recursive: true })

  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(hostDir, ...rel.split("/"))
    await mkdir(path.dirname(abs), { recursive: true })
    await writeFile(abs, content, "utf8")
  }

  return {
    hostDir,
    guestDir: `/workspace/sessions/${safeId}`,
  }
}

export function resolveGuestSessionDir(sessionId: string): {
  hostDir: string
  guestDir: string
} {
  const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "session"
  const hostRoot = env.SANDBOX_WORKSPACE_DIR || DEFAULT_WORKSPACE
  return {
    hostDir: path.join(hostRoot, "sessions", safeId),
    guestDir: `/workspace/sessions/${safeId}`,
  }
}

function pickEntry(
  files: Record<string, string>,
  entryPath?: string
): string | null {
  if (entryPath) {
    const safe = safeRelPath(entryPath)
    if (safe && files[safe] != null) return safe
  }
  const preferred = [
    "src/index.ts",
    "src/main.ts",
    "src/index.js",
    "src/main.js",
    "index.ts",
    "main.ts",
    "index.js",
    "main.js",
    "main.py",
    "app.py",
    "solution/solution.ts",
    "solution/solution.js",
    "solution/solution.py",
  ]
  for (const p of preferred) {
    if (files[p] != null) return p
  }
  // First executable-looking file
  const keys = Object.keys(files).sort()
  for (const k of keys) {
    if (/\.(ts|tsx|js|mjs|cjs|py|sh)$/i.test(k)) return k
  }
  return keys[0] ?? null
}

function buildCommand(
  mode: SandboxMode,
  files: Record<string, string>,
  entryPath?: string
): { argv: string[]; label: string } | { error: string } {
  if (mode === "tests") {
    const pkg = files["package.json"]
    if (pkg) {
      try {
        const json = JSON.parse(pkg) as {
          scripts?: Record<string, string>
        }
        // No network / node_modules install in sandbox — run script body only.
        if (json.scripts?.test?.trim()) {
          const script = json.scripts.test.trim()
          return {
            argv: ["bash", "-lc", script],
            label: `test: ${script}`,
          }
        }
      } catch {
        // fall through
      }
    }
    const testFiles = Object.keys(files)
      .filter((p) => /\.(test|spec)\.(ts|tsx|js|mjs|cjs)$/i.test(p) || /tests?\.(ts|js)$/i.test(p))
      .sort()
    if (testFiles.length > 0) {
      const first = testFiles[0]!
      if (/\.tsx?$/i.test(first)) {
        const args = testFiles
          .map((f) => JSON.stringify(f))
          .join(" ")
        return {
          argv: [
            "bash",
            "-lc",
            `node --experimental-strip-types --test ${args}`,
          ],
          label: `node --test (${testFiles.length} file(s))`,
        }
      }
      const args = testFiles.map((f) => JSON.stringify(f)).join(" ")
      return {
        argv: ["bash", "-lc", `node --test ${args}`],
        label: `node --test (${testFiles.length} file(s))`,
      }
    }
    const pyTests = Object.keys(files).filter(
      (p) => /test_.*\.py$/i.test(p) || /_test\.py$/i.test(p)
    )
    if (pyTests.length > 0) {
      return {
        argv: ["python3", "-m", "unittest", "discover", "-s", ".", "-p", "*test*.py", "-v"],
        label: "python3 -m unittest",
      }
    }
    return {
      error:
        "No tests found (add package.json scripts.test, *.test.ts, or test_*.py).",
    }
  }

  // mode === "run"
  const pkg = files["package.json"]
  if (pkg) {
    try {
      const json = JSON.parse(pkg) as { scripts?: Record<string, string> }
      if (json.scripts?.start?.trim()) {
        const script = json.scripts.start.trim()
        return {
          argv: ["bash", "-lc", script],
          label: `start: ${script}`,
        }
      }
    } catch {
      // fall through
    }
  }

  const entry = pickEntry(files, entryPath)
  if (!entry) return { error: "No entry file to run" }

  if (/\.py$/i.test(entry)) {
    return {
      argv: ["python3", entry],
      label: `python3 ${entry}`,
    }
  }
  if (/\.sh$/i.test(entry)) {
    return {
      argv: ["bash", entry],
      label: `bash ${entry}`,
    }
  }
  if (/\.tsx?$/i.test(entry)) {
    return {
      argv: ["node", "--experimental-strip-types", entry],
      label: `node ${entry}`,
    }
  }
  if (/\.(js|mjs|cjs)$/i.test(entry)) {
    return {
      argv: ["node", entry],
      label: `node ${entry}`,
    }
  }
  return { error: `Cannot run file type: ${entry}` }
}

type StreamHandlers = {
  onStart?: (info: {
    runId: string
    command: string
  }) => void | Promise<void>
  onStdout: (chunk: string) => void
  onStderr: (chunk: string) => void
}

async function dockerExecStream(opts: {
  sessionId: string
  runId: string
  guestDir: string
  argv: string[]
  label: string
  timeoutMs: number
  handlers: StreamHandlers
}): Promise<SandboxRunResult> {
  if (!env.SANDBOX_CONTAINER) {
    return {
      runId: opts.runId,
      exitCode: null,
      error: "Sandbox disabled (SANDBOX_CONTAINER empty).",
      command: opts.label,
    }
  }

  const ac = new AbortController()
  activeRuns.set(opts.sessionId, ac)

  try {
    await opts.handlers.onStart?.({ runId: opts.runId, command: opts.label })

    const exitCode = await new Promise<number | null>((resolve) => {
      const child = spawn(
        "docker",
        [
          "exec",
          "-u",
          "coder",
          "-w",
          opts.guestDir,
          env.SANDBOX_CONTAINER,
          ...opts.argv,
        ],
        {
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        }
      )

      const kill = () => {
        try {
          child.kill("SIGKILL")
        } catch {
          // ignore
        }
      }

      const timer = setTimeout(() => {
        opts.handlers.onStderr(
          `\n[sandbox] timed out after ${opts.timeoutMs / 1000}s\n`
        )
        kill()
      }, opts.timeoutMs)

      ac.signal.addEventListener("abort", () => {
        opts.handlers.onStderr("\n[sandbox] aborted\n")
        kill()
      })

      child.stdout?.on("data", (buf: Buffer) => {
        opts.handlers.onStdout(buf.toString("utf8"))
      })
      child.stderr?.on("data", (buf: Buffer) => {
        opts.handlers.onStderr(buf.toString("utf8"))
      })

      child.on("error", (err) => {
        clearTimeout(timer)
        opts.handlers.onStderr(
          `\n[sandbox] failed to start docker: ${err.message}\n` +
            "Is the sandbox up? npm run sandbox:up\n"
        )
        resolve(null)
      })

      child.on("close", (code) => {
        clearTimeout(timer)
        resolve(code)
      })
    })

    return {
      runId: opts.runId,
      exitCode,
      command: opts.label,
      error:
        exitCode === null
          ? "Sandbox process failed (is mockmatch-sandbox running?)"
          : undefined,
    }
  } catch (err) {
    logger.error({ err, sessionId: opts.sessionId }, "sandbox exec failed")
    return {
      runId: opts.runId,
      exitCode: null,
      command: opts.label,
      error: err instanceof Error ? err.message : String(err),
    }
  } finally {
    activeRuns.delete(opts.sessionId)
  }
}

/**
 * Sync files + docker exec. Streams stdout/stderr via callbacks.
 * `onStart` fires once command is resolved and files are synced (before exec).
 */
export async function executeSandboxRun(
  req: SandboxRunRequest,
  handlers: StreamHandlers
): Promise<SandboxRunResult> {
  const runId = randomBytes(6).toString("hex")
  if (activeRuns.has(req.sessionId)) {
    return {
      runId,
      exitCode: null,
      error: "A sandbox run is already in progress for this workspace.",
      command: "",
    }
  }

  const cmd = buildCommand(req.mode, req.files, req.entryPath)
  if ("error" in cmd) {
    return { runId, exitCode: null, error: cmd.error, command: "" }
  }

  const { guestDir } = await syncFilesToHost(req.sessionId, req.files)
  return dockerExecStream({
    sessionId: req.sessionId,
    runId,
    guestDir,
    argv: cmd.argv,
    label: cmd.label,
    timeoutMs: RUN_TIMEOUT_MS,
    handlers,
  })
}


