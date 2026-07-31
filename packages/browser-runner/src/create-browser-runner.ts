import { createJavascriptAdapter } from "./adapters/javascript"
import { createUnsupportedAdapter } from "./adapters/unsupported"
import type {
  BrowserRunner,
  BrowserRunnerOptions,
  EnsureReadyProgress,
  LanguageAdapter,
  RunEvent,
  RuntimeLanguage,
} from "./types"

const UNSUPPORTED: RuntimeLanguage[] = [
  "python",
  "typescript",
  "c",
  "cpp",
  "go",
  "rust",
  "java",
  "csharp",
  "nodejs",
]

function defaultAdapters(): LanguageAdapter[] {
  return [
    createJavascriptAdapter(),
    createUnsupportedAdapter(UNSUPPORTED),
  ]
}

/**
 * Create a host-side browser code runner.
 * JS runs in a Dedicated Worker; other languages stub until adapters land.
 */
export function createBrowserRunner(
  options: BrowserRunnerOptions = {}
): BrowserRunner {
  const adapters = options.adapters ?? defaultAdapters()
  const byLang = new Map<RuntimeLanguage, LanguageAdapter>()

  for (const adapter of adapters) {
    for (const lang of adapter.languages) {
      // First registration wins (real adapters before stubs)
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
      return ["javascript"]
    },

    isSupported(language) {
      return language === "javascript"
    },

    async ensureReady(language, onProgress?: EnsureReadyProgress) {
      guard()
      const adapter = byLang.get(language)
      if (!adapter) {
        throw new Error(`No adapter for language: ${language}`)
      }
      onProgress?.(0, `Preparing ${language}…`)
      await adapter.ensureReady?.(language, onProgress)
      onProgress?.(1, "Ready")
    },

    async run(req, onEvent, signal) {
      guard()

      // Cancel previous run
      activeAbort?.abort()
      const local = new AbortController()
      activeAbort = local

      const onAbort = () => local.abort()
      signal?.addEventListener("abort", onAbort, { once: true })

      const merged = local.signal

      try {
        if (!(req.entryPath in req.files)) {
          onEvent({
            type: "status",
            phase: "error",
            message: `Entry file not found: ${req.entryPath}`,
          })
          onEvent({ type: "stderr", chunk: `Entry file not found: ${req.entryPath}\n` })
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
            message: `Loading ${req.language} runtime…`,
          })
          await adapter.ensureReady(req.language, (p, label) => {
            onEvent({
              type: "status",
              phase: "loading",
              message: `${label} (${Math.round(p * 100)}%)`,
            })
          })
        }

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
      return event.pass
        ? `\r\n\x1b[32m✓ ${event.name}\x1b[0m\r\n`
        : `\r\n\x1b[31m✗ ${event.name}\x1b[0m\r\n`
    default:
      return null
  }
}
