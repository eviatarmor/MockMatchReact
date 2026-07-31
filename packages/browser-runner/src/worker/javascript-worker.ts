/**
 * Isolated JS execution worker.
 * Parent posts { type: "run", source, stdin, args }.
 * Worker posts RunEvent-shaped messages.
 */

type RunMsg = {
  type: "run"
  source: string
  stdin: string
  args: string[]
}

function post(msg: unknown) {
  self.postMessage(msg)
}

function makeConsole() {
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
      post({ type: stream, chunk })
    }
  return {
    log: write("stdout"),
    info: write("stdout"),
    debug: write("stdout"),
    warn: write("stderr"),
    error: write("stderr"),
  }
}

function runSource(source: string, stdin: string, args: string[]) {
  const started = performance.now()
  const consoleApi = makeConsole()

  // Minimal process-like surface for algorithm scripts
  const processShim = {
    argv: ["node", "main.js", ...args],
    env: {},
    stdout: {
      write: (chunk: string) => {
        post({ type: "stdout", chunk: String(chunk) })
        return true
      },
    },
    stderr: {
      write: (chunk: string) => {
        post({ type: "stderr", chunk: String(chunk) })
        return true
      },
    },
    exit: (code = 0) => {
      throw new ProcessExit(code)
    },
  }

  // Read full stdin (common interview pattern)
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

  try {
    // Async Function so top-level await works
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
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

    const result = fn(
      consoleApi,
      processShim,
      stdin,
      readStdin,
      readline,
      args
    )

    Promise.resolve(result)
      .then(() => {
        post({
          type: "exit",
          code: 0,
          durationMs: Math.round(performance.now() - started),
        })
      })
      .catch((err: unknown) => {
        if (err instanceof ProcessExit) {
          post({
            type: "exit",
            code: err.code,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }
        const message = err instanceof Error ? (err.stack ?? err.message) : String(err)
        post({ type: "stderr", chunk: `${message}\n` })
        post({
          type: "exit",
          code: 1,
          durationMs: Math.round(performance.now() - started),
        })
      })
  } catch (err) {
    if (err instanceof ProcessExit) {
      post({
        type: "exit",
        code: err.code,
        durationMs: Math.round(performance.now() - started),
      })
      return
    }
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err)
    post({ type: "stderr", chunk: `${message}\n` })
    post({
      type: "exit",
      code: 1,
      durationMs: Math.round(performance.now() - started),
    })
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

self.onmessage = (ev: MessageEvent<RunMsg>) => {
  const data = ev.data
  if (!data || data.type !== "run") return
  runSource(data.source, data.stdin ?? "", data.args ?? [])
}

post({ type: "ready" })
