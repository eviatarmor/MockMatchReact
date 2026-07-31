import { createCCppAdapter } from "./adapters/c-cpp-runno"
import { createJavascriptAdapter } from "./adapters/javascript"
import { createPythonAdapter } from "./adapters/python-pyodide"
import { createTypescriptAdapter } from "./adapters/typescript-esbuild"
import { createUnsupportedAdapter } from "./adapters/unsupported"
import type {
  BrowserRunner,
  BrowserRunnerOptions,
  EnsureReadyProgress,
  LanguageAdapter,
  RunEvent,
  RunRequest,
  RuntimeLanguage,
} from "./types"

const SUPPORTED: RuntimeLanguage[] = [
  "javascript",
  "typescript",
  "python",
  "c",
  "cpp",
]

const UNSUPPORTED: RuntimeLanguage[] = [
  "go",
  "rust",
  "java",
  "csharp",
  "nodejs",
]

function defaultAdapters(): LanguageAdapter[] {
  return [
    createJavascriptAdapter(),
    createTypescriptAdapter(),
    createPythonAdapter(),
    createCCppAdapter(),
    createUnsupportedAdapter(UNSUPPORTED),
  ]
}

/** Normalize stdout for I/O tests (trim ends, unify newlines). */
export function normalizeStdout(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd()
}

async function captureRun(
  adapter: LanguageAdapter,
  req: RunRequest,
  signal?: AbortSignal
): Promise<{ stdout: string; stderr: string; code: number }> {
  let stdout = ""
  let stderr = ""
  let code = 1

  await adapter.run(
    { ...req, tests: undefined },
    (event) => {
      if (event.type === "stdout") stdout += event.chunk
      if (event.type === "stderr") stderr += event.chunk
      if (event.type === "exit") code = event.code
    },
    signal
  )

  return { stdout, stderr, code }
}

/**
 * Create a host-side browser code runner.
 * JS / TS / Python shipped; other languages stub until later phases.
 * When `req.tests` is set, runs I/O cases and emits `test-result` events.
 */
export function createBrowserRunner(
  options: BrowserRunnerOptions = {}
): BrowserRunner {
  const adapters = options.adapters ?? defaultAdapters()
  const byLang = new Map<RuntimeLanguage, LanguageAdapter>()

  for (const adapter of adapters) {
    for (const lang of adapter.languages) {
      if (!byLang.has(lang)) {
        byLang.set(lang, adapter)
      }
    }
  }

  let disposed = false
  let activeAbort: AbortController | null = null

  const guard = () => {
    if (disposed) throw new Error("BrowserRunner is disposed")
  }

  return {
    supportedLanguages() {
      return [...SUPPORTED]
    },

    isSupported(language) {
      return SUPPORTED.includes(language)
    },

    async ensureReady(language, onProgress?: EnsureReadyProgress) {
      guard()
      const adapter = byLang.get(language)
      if (!adapter) {
        throw new Error(`No adapter for language: ${language}`)
      }
      onProgress?.(0, "Initializing…")
      await adapter.ensureReady?.(language, onProgress)
      onProgress?.(1, "Ready")
    },

    async run(req, onEvent, signal) {
      guard()

      activeAbort?.abort()
      const local = new AbortController()
      activeAbort = local

      const onAbort = () => local.abort()
      signal?.addEventListener("abort", onAbort, { once: true })

      const merged = local.signal
      const started = performance.now()

      try {
        if (!(req.entryPath in req.files)) {
          onEvent({
            type: "status",
            phase: "error",
            message: `Entry file not found: ${req.entryPath}`,
          })
          onEvent({
            type: "stderr",
            chunk: `Entry file not found: ${req.entryPath}\n`,
          })
          onEvent({ type: "exit", code: 1, durationMs: 0 })
          return
        }

        const adapter = byLang.get(req.language)
        if (!adapter) {
          onEvent({
            type: "status",
            phase: "error",
            message: `No adapter for language: ${req.language}`,
          })
          onEvent({
            type: "stderr",
            chunk: `No adapter for language: ${req.language}\n`,
          })
          onEvent({ type: "exit", code: 1, durationMs: 0 })
          return
        }

        if (adapter.ensureReady) {
          onEvent({
            type: "status",
            phase: "loading",
            message: "Initializing…",
          })
          await adapter.ensureReady(req.language)
        }

        if (merged.aborted) {
          onEvent({ type: "stderr", chunk: "\n[aborted]\n" })
          onEvent({ type: "exit", code: 130, durationMs: 0 })
          return
        }

        // ── I/O test harness ──────────────────────────────────────────
        const tests = req.tests
        if (tests && tests.length > 0) {
          onEvent({
            type: "status",
            phase: "running",
            message: `Running ${tests.length} test(s)…`,
          })

          let passed = 0
          for (const test of tests) {
            if (merged.aborted) {
              onEvent({ type: "stderr", chunk: "\n[aborted]\n" })
              onEvent({
                type: "exit",
                code: 130,
                durationMs: Math.round(performance.now() - started),
              })
              return
            }

            const { stdout, code } = await captureRun(
              adapter,
              {
                ...req,
                stdin: test.stdin ?? "",
                tests: undefined,
              },
              merged
            )

            const actual = normalizeStdout(stdout)
            const expected = normalizeStdout(test.expectedStdout ?? "")
            // Treat non-zero exit as fail unless expected empty and we only care stdout
            const pass = code === 0 && actual === expected
            if (pass) passed += 1

            onEvent({
              type: "test-result",
              name: test.name,
              pass,
              actual,
              expected,
            })
          }

          const allPass = passed === tests.length
          onEvent({
            type: "status",
            phase: "done",
            message: allPass
              ? `All ${passed} test(s) passed`
              : `${passed}/${tests.length} test(s) passed`,
          })
          onEvent({
            type: "exit",
            code: allPass ? 0 : 1,
            durationMs: Math.round(performance.now() - started),
          })
          return
        }

        // ── Single run ────────────────────────────────────────────────
        await adapter.run(req, onEvent, merged)
      } finally {
        signal?.removeEventListener("abort", onAbort)
        if (activeAbort === local) activeAbort = null
      }
    },

    dispose() {
      disposed = true
      activeAbort?.abort()
      activeAbort = null
      for (const adapter of new Set(byLang.values())) {
        adapter.dispose?.()
      }
    },
  }
}

/** Format RunEvents into terminal-friendly lines (host helper). */
export function formatRunEventLine(event: RunEvent): string | null {
  switch (event.type) {
    case "status":
      if (event.message) return `\r\n\x1b[90m${event.message}\x1b[0m\r\n`
      return null
    case "stdout":
      return event.chunk.replace(/\n/g, "\r\n")
    case "stderr":
      return `\x1b[31m${event.chunk.replace(/\n/g, "\r\n")}\x1b[0m`
    case "exit":
      return `\r\n\x1b[90m[exit ${event.code} · ${event.durationMs}ms]\x1b[0m\r\n`
    case "test-result":
      if (event.pass) {
        return `\r\n\x1b[32m✓ ${event.name}\x1b[0m\r\n`
      }
      return (
        `\r\n\x1b[31m✗ ${event.name}\x1b[0m\r\n` +
        `\x1b[90m  expected: ${JSON.stringify(event.expected ?? "")}\x1b[0m\r\n` +
        `\x1b[90m  actual:   ${JSON.stringify(event.actual ?? "")}\x1b[0m\r\n`
      )
    default:
      return null
  }
}
