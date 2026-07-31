import type { LanguageAdapter, RunEvent, RunRequest } from "../types"

const DEFAULT_TIMEOUT_MS = 15_000

/**
 * JavaScript adapter.
 *
 * Runs on the main thread via AsyncFunction (fake console/process).
 * Dedicated Workers are unreliable in this Vite monorepo (Monaco also
 * falls back to main-thread workers), and blob workers still race the
 * terminal mount. Timeout enforced with Promise.race.
 */
export function createJavascriptAdapter(): LanguageAdapter {
  return {
    id: "javascript",
    languages: ["javascript"] as const,

    async run(req, onEvent, signal) {
      const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS
      const source = req.files[req.entryPath]
      if (source == null) {
        onEvent({
          type: "status",
          phase: "error",
          message: `Entry file not found: ${req.entryPath}`,
        })
        onEvent({ type: "exit", code: 1, durationMs: 0 })
        return
      }

      if (!source.trim()) {
        onEvent({
          type: "stderr",
          chunk: `Entry file is empty: ${req.entryPath}\n`,
        })
        onEvent({ type: "exit", code: 1, durationMs: 0 })
        return
      }

      if (signal?.aborted) {
        onEvent({ type: "status", phase: "error", message: "Run aborted" })
        onEvent({ type: "exit", code: 130, durationMs: 0 })
        return
      }

      onEvent({
        type: "status",
        phase: "running",
        message: `Running ${req.entryPath}`,
      })

      const started = performance.now()

      try {
        await Promise.race([
          executeSource(source, req.stdin ?? "", req.args ?? [], onEvent),
          rejectOnTimeout(timeoutMs, signal),
        ])
        if (signal?.aborted) {
          onEvent({ type: "stderr", chunk: "\n[aborted]\n" })
          onEvent({
            type: "exit",
            code: 130,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }
        onEvent({
          type: "exit",
          code: 0,
          durationMs: Math.round(performance.now() - started),
        })
      } catch (err) {
        if (err instanceof ProcessExit) {
          onEvent({
            type: "exit",
            code: err.code,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }
        if (err instanceof RunTimeout) {
          onEvent({
            type: "stderr",
            chunk: `\n[timeout after ${timeoutMs}ms]\n`,
          })
          onEvent({
            type: "exit",
            code: 124,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }
        if (err instanceof RunAborted) {
          onEvent({ type: "stderr", chunk: "\n[aborted]\n" })
          onEvent({
            type: "exit",
            code: 130,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }
        const message =
          err instanceof Error ? (err.stack ?? err.message) : String(err)
        onEvent({ type: "stderr", chunk: `${message}\n` })
        onEvent({
          type: "exit",
          code: 1,
          durationMs: Math.round(performance.now() - started),
        })
      }
    },
  }
}

class ProcessExit extends Error {
  readonly code: number
  constructor(code: number) {
    super(`process.exit(${code})`)
    this.code = code
    this.name = "ProcessExit"
  }
}

class RunTimeout extends Error {
  constructor() {
    super("timeout")
    this.name = "RunTimeout"
  }
}

class RunAborted extends Error {
  constructor() {
    super("aborted")
    this.name = "RunAborted"
  }
}

function rejectOnTimeout(
  timeoutMs: number,
  signal?: AbortSignal
): Promise<never> {
  return new Promise((_, reject) => {
    const timer = window.setTimeout(() => reject(new RunTimeout()), timeoutMs)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new RunAborted())
    }
    if (signal) {
      if (signal.aborted) {
        window.clearTimeout(timer)
        reject(new RunAborted())
        return
      }
      signal.addEventListener("abort", onAbort, { once: true })
    }
  })
}

function makeConsole(onEvent: (e: RunEvent) => void) {
  const write =
    (stream: "stdout" | "stderr") =>
    (...args: unknown[]) => {
      const chunk =
        args
          .map((a) => {
            if (typeof a === "string") return a
            try {
              return JSON.stringify(a)
            } catch {
              return String(a)
            }
          })
          .join(" ") + "\n"
      onEvent({ type: stream, chunk })
    }
  return {
    log: write("stdout"),
    info: write("stdout"),
    debug: write("stdout"),
    warn: write("stderr"),
    error: write("stderr"),
  }
}

async function executeSource(
  source: string,
  stdin: string,
  args: string[],
  onEvent: (e: RunEvent) => void
): Promise<void> {
  const consoleApi = makeConsole(onEvent)
  const processShim = {
    argv: ["node", "main.js", ...args],
    env: {} as Record<string, string>,
    stdout: {
      write: (chunk: string) => {
        onEvent({ type: "stdout", chunk: String(chunk) })
        return true
      },
    },
    stderr: {
      write: (chunk: string) => {
        onEvent({ type: "stderr", chunk: String(chunk) })
        return true
      },
    },
    exit: (code = 0) => {
      throw new ProcessExit(code)
    },
  }

  let stdinCursor = 0
  const readStdin = () => stdin
  const readline = () => {
    if (stdinCursor >= stdin.length) return null
    const next = stdin.indexOf("\n", stdinCursor)
    if (next < 0) {
      const line = stdin.slice(stdinCursor)
      stdinCursor = stdin.length
      return line
    }
    const line = stdin.slice(stdinCursor, next)
    stdinCursor = next + 1
    return line
  }

  const AsyncFunction = Object.getPrototypeOf(async function () {})
    .constructor as new (
    ...args: string[]
  ) => (...args: unknown[]) => Promise<unknown>

  const fn = new AsyncFunction(
    "console",
    "process",
    "stdin",
    "readStdin",
    "readline",
    "args",
    `"use strict";\n${source}\n`
  )

  await fn(consoleApi, processShim, stdin, readStdin, readline, args)
}

/**
 * Resolve a RunRequest for pure JS algorithm runs (tests helper).
 */
export function assertJavascriptRequest(req: RunRequest): void {
  if (req.language !== "javascript") {
    throw new Error(`Javascript adapter cannot run language: ${req.language}`)
  }
}
