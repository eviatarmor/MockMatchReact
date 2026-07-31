import type { RunEvent } from "../types"

export const DEFAULT_JS_TIMEOUT_MS = 15_000

export class ProcessExit extends Error {
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

/**
 * Execute plain JS (already type-stripped) with fake console/process/stdin helpers.
 */
export async function executeJavascriptSource(
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

export type RunScriptOptions = {
  source: string
  stdin?: string
  args?: string[]
  timeoutMs?: number
  entryLabel?: string
  signal?: AbortSignal
}

/**
 * Full JS script run with timeout + exit events.
 */
export async function runJavascriptScript(
  opts: RunScriptOptions,
  onEvent: (e: RunEvent) => void
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_JS_TIMEOUT_MS
  const source = opts.source
  const label = opts.entryLabel ?? "script"

  if (!source.trim()) {
    onEvent({ type: "stderr", chunk: `Entry file is empty: ${label}\n` })
    onEvent({ type: "exit", code: 1, durationMs: 0 })
    return
  }

  if (opts.signal?.aborted) {
    onEvent({ type: "status", phase: "error", message: "Run aborted" })
    onEvent({ type: "exit", code: 130, durationMs: 0 })
    return
  }

  onEvent({
    type: "status",
    phase: "running",
    message: `Running ${label}`,
  })

  const started = performance.now()

  try {
    await Promise.race([
      executeJavascriptSource(
        source,
        opts.stdin ?? "",
        opts.args ?? [],
        onEvent
      ),
      rejectOnTimeout(timeoutMs, opts.signal),
    ])
    if (opts.signal?.aborted) {
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
}
