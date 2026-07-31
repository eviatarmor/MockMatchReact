import type { LanguageAdapter, RunEvent, RunRequest, RuntimeLanguage } from "../types"

type RunnoRuntime = "clang" | "clangpp"

type RunnoComplete = {
  resultType: "complete"
  stdout: string
  stderr: string
  exitCode: number
}

type RunnoCrash = {
  resultType: "crash"
  error: { message: string; type: string }
}

type RunnoResult =
  | RunnoComplete
  | RunnoCrash
  | { resultType: "terminated" }
  | { resultType: "timeout" }

type HeadlessRunCode = (
  runtime: RunnoRuntime,
  code: string,
  stdin?: string
) => Promise<RunnoResult>

type WasiFile = {
  path: string
  timestamps: { access: Date; modification: Date; change: Date }
  mode: "string"
  content: string
}

type HeadlessRunFS = (
  runtime: RunnoRuntime,
  entryPath: string,
  fs: Record<string, WasiFile>,
  stdin?: string
) => Promise<RunnoResult>

type RunnoModule = {
  headlessRunCode: HeadlessRunCode
  headlessRunFS: HeadlessRunFS
}

const DEFAULT_TIMEOUT_MS = 60_000

let runnoReady: Promise<RunnoModule> | null = null

async function getRunno(): Promise<RunnoModule> {
  if (!runnoReady) {
    runnoReady = (async () => {
      // Dynamic import — keep cold path light
      const mod = (await import("@runno/runtime")) as unknown as RunnoModule
      if (typeof mod.headlessRunCode !== "function") {
        // Vite CJS/ESM interop
        const d = (mod as unknown as { default?: RunnoModule }).default
        if (d && typeof d.headlessRunCode === "function") return d
        throw new Error("@runno/runtime: headlessRunCode not found")
      }
      return mod
    })().catch((err) => {
      runnoReady = null
      throw err
    })
  }
  return runnoReady
}

function runtimeForLanguage(language: RuntimeLanguage): RunnoRuntime {
  return language === "c" ? "clang" : "clangpp"
}

function isSourcePath(path: string): boolean {
  return /\.(c|cc|cpp|cxx|h|hpp|hh)$/i.test(path)
}

function buildWasiFs(files: Record<string, string>): Record<string, WasiFile> {
  const now = new Date()
  const timestamps = {
    access: now,
    modification: now,
    change: now,
  }
  const fs: Record<string, WasiFile> = {}
  for (const [path, content] of Object.entries(files)) {
    if (/\.(json|md|lock)$/i.test(path)) continue
    const normalized = path.startsWith("/") ? path : `/${path}`
    fs[normalized] = {
      path: normalized,
      timestamps,
      content,
      mode: "string",
    }
  }
  return fs
}

function emitResult(result: RunnoResult, onEvent: (e: RunEvent) => void, started: number) {
  if (result.resultType === "complete") {
    if (result.stdout) {
      onEvent({
        type: "stdout",
        chunk: result.stdout.endsWith("\n")
          ? result.stdout
          : `${result.stdout}\n`,
      })
    }
    if (result.stderr) {
      onEvent({
        type: "stderr",
        chunk: result.stderr.endsWith("\n")
          ? result.stderr
          : `${result.stderr}\n`,
      })
    }
    onEvent({
      type: "exit",
      code: result.exitCode,
      durationMs: Math.round(performance.now() - started),
    })
    return
  }

  if (result.resultType === "crash") {
    onEvent({
      type: "stderr",
      chunk: `${result.error.type}: ${result.error.message}\n`,
    })
    onEvent({
      type: "exit",
      code: 1,
      durationMs: Math.round(performance.now() - started),
    })
    return
  }

  if (result.resultType === "timeout") {
    onEvent({ type: "stderr", chunk: "\n[timeout]\n" })
    onEvent({
      type: "exit",
      code: 124,
      durationMs: Math.round(performance.now() - started),
    })
    return
  }

  onEvent({ type: "stderr", chunk: "\n[terminated]\n" })
  onEvent({
    type: "exit",
    code: 130,
    durationMs: Math.round(performance.now() - started),
  })
}

/**
 * C / C++ via Runno (MIT): clang / clang++ WASM + WASI.
 * Requires cross-origin isolation (COOP/COEP) for SharedArrayBuffer.
 */
export function createCCppAdapter(): LanguageAdapter {
  return {
    id: "c-cpp-runno",
    languages: ["c", "cpp"] as const,

    async ensureReady() {
      await getRunno()
    },

    async run(req: RunRequest, onEvent, signal) {
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

      const started = performance.now()
      const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS
      const runtime = runtimeForLanguage(req.language)

      onEvent({
        type: "status",
        phase: "loading",
        message: "Initializing…",
      })

      try {
        const runno = await getRunno()

        if (signal?.aborted) {
          onEvent({ type: "stderr", chunk: "\n[aborted]\n" })
          onEvent({ type: "exit", code: 130, durationMs: 0 })
          return
        }

        onEvent({
          type: "status",
          phase: "compiling",
          message: `Compiling ${req.entryPath}…`,
        })

        const sourcePaths = Object.keys(req.files).filter(isSourcePath)
        const multiFile = sourcePaths.length > 1

        const runPromise = multiFile
          ? runno.headlessRunFS(
              runtime,
              req.entryPath.startsWith("/")
                ? req.entryPath
                : `/${req.entryPath}`,
              buildWasiFs(req.files),
              req.stdin ?? ""
            )
          : runno.headlessRunCode(runtime, source, req.stdin ?? "")

        const result = await Promise.race([
          runPromise,
          new Promise<RunnoResult>((_, reject) => {
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

        emitResult(result, onEvent, started)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
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
        // Common failure when COOP/COEP missing
        const hint = /SharedArrayBuffer|cross-origin|security/i.test(message)
          ? "\nHint: C/C++ needs Cross-Origin-Isolation (COOP/COEP headers).\n"
          : ""
        onEvent({
          type: "stderr",
          chunk: `C/C++ run failed: ${message}${hint}\n`,
        })
        onEvent({
          type: "exit",
          code: 1,
          durationMs: Math.round(performance.now() - started),
        })
      }
    },
  }
}
