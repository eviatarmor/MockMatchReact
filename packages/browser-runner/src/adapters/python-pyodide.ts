import type { LanguageAdapter } from "../types"
import { PYODIDE_INDEX_URL, PYODIDE_MODULE_URL } from "../assets/manifest"

const DEFAULT_TIMEOUT_MS = 30_000

type PyodideInterface = {
  runPythonAsync: (code: string, options?: { globals?: unknown }) => Promise<unknown>
  setStdout: (opts: { batched: (s: string) => void }) => void
  setStderr: (opts: { batched: (s: string) => void }) => void
  FS: {
    writeFile: (path: string, data: string | Uint8Array) => void
    mkdirTree: (path: string) => void
    analyzePath: (path: string) => { exists: boolean }
  }
  globals: {
    set: (key: string, value: unknown) => void
  }
}

type LoadPyodideFn = (opts: {
  indexURL: string
  stdout?: (text: string) => void
  stderr?: (text: string) => void
}) => Promise<PyodideInterface>

let pyodideReady: Promise<PyodideInterface> | null = null

async function getPyodide(
  onProgress?: (p: number, label: string) => void
): Promise<PyodideInterface> {
  if (!pyodideReady) {
    pyodideReady = (async () => {
      onProgress?.(0.05, "Downloading Python runtime (Pyodide)…")
      const mod = (await import(
        /* @vite-ignore */ PYODIDE_MODULE_URL
      )) as { loadPyodide: LoadPyodideFn }
      onProgress?.(0.35, "Initializing CPython WASM…")
      const pyodide = await mod.loadPyodide({
        indexURL: PYODIDE_INDEX_URL,
      })
      onProgress?.(1, "Python ready")
      return pyodide
    })().catch((err) => {
      pyodideReady = null
      throw err
    })
  }
  return pyodideReady
}

function ensureDir(py: PyodideInterface, filePath: string) {
  const parts = filePath.split("/")
  if (parts.length <= 1) return
  let cur = ""
  for (let i = 0; i < parts.length - 1; i++) {
    cur = cur ? `${cur}/${parts[i]}` : parts[i]!
    try {
      if (!py.FS.analyzePath(cur).exists) {
        py.FS.mkdirTree(cur)
      }
    } catch {
      try {
        py.FS.mkdirTree(cur)
      } catch {
        // ignore existing
      }
    }
  }
}

function mountFiles(py: PyodideInterface, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    const normalized = path.replace(/^\//, "")
    ensureDir(py, normalized)
    py.FS.writeFile(normalized, content)
  }
}

/**
 * Python adapter via Pyodide (lazy CDN load, MPL-2.0).
 */
export function createPythonAdapter(): LanguageAdapter {
  let disposed = false

  return {
    id: "python-pyodide",
    languages: ["python"] as const,

    async ensureReady(_language, onProgress) {
      if (disposed) throw new Error("Python adapter disposed")
      await getPyodide(onProgress)
    },

    async run(req, onEvent, signal) {
      if (disposed) {
        onEvent({
          type: "status",
          phase: "error",
          message: "Python adapter disposed",
        })
        onEvent({ type: "exit", code: 1, durationMs: 0 })
        return
      }

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

      const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS
      const started = performance.now()

      try {
        onEvent({
          type: "status",
          phase: "loading",
          message: "Initializing…",
        })
        const py = await getPyodide()

        if (signal?.aborted) {
          onEvent({ type: "stderr", chunk: "\n[aborted]\n" })
          onEvent({
            type: "exit",
            code: 130,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }

        // Wire stdout/stderr for this run
        py.setStdout({
          batched: (s: string) => {
            onEvent({ type: "stdout", chunk: s.endsWith("\n") ? s : `${s}\n` })
          },
        })
        py.setStderr({
          batched: (s: string) => {
            onEvent({ type: "stderr", chunk: s.endsWith("\n") ? s : `${s}\n` })
          },
        })

        mountFiles(py, req.files)

        onEvent({
          type: "status",
          phase: "running",
          message: `Running ${req.entryPath}`,
        })

        // Provide stdin as a string module helper for exercises
        const stdin = req.stdin ?? ""
        const stdinLiteral = JSON.stringify(stdin)
        const entry = req.entryPath.replace(/\\/g, "/")
        const bootstrap = `
import sys, io, runpy
sys.stdin = io.StringIO(${stdinLiteral})
# Exercise helper (optional)
def read_stdin():
    return sys.stdin.read()
`
        const runCode = `
${bootstrap}
# Execute entry as __main__
runpy.run_path(${JSON.stringify(entry)}, run_name="__main__")
`

        await Promise.race([
          py.runPythonAsync(runCode),
          new Promise<never>((_, reject) => {
            const t = window.setTimeout(
              () => reject(new Error(`timeout after ${timeoutMs}ms`)),
              timeoutMs
            )
            signal?.addEventListener(
              "abort",
              () => {
                window.clearTimeout(t)
                reject(new Error("aborted"))
              },
              { once: true }
            )
          }),
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
        const message =
          err instanceof Error ? err.message : String(err)
        if (message === "aborted") {
          onEvent({ type: "stderr", chunk: "\n[aborted]\n" })
          onEvent({
            type: "exit",
            code: 130,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }
        if (message.startsWith("timeout after")) {
          onEvent({ type: "stderr", chunk: `\n[${message}]\n` })
          onEvent({
            type: "exit",
            code: 124,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }
        // Pyodide Python errors often include traceback in message
        onEvent({ type: "stderr", chunk: `${formatPyError(err)}\n` })
        onEvent({
          type: "exit",
          code: 1,
          durationMs: Math.round(performance.now() - started),
        })
      }
    },

    dispose() {
      disposed = true
      // Keep cached pyodide for page lifetime; drop handle
      pyodideReady = null
    },
  }
}

function formatPyError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { message?: string; type?: string; stack?: string }
    if (e.message) return e.message
    if (e.stack) return e.stack
  }
  return String(err)
}
