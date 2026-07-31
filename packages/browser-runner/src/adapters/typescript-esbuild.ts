import type { LanguageAdapter } from "../types"
import { ESBUILD_WASM_URL } from "../assets/manifest"
import { DEFAULT_JS_TIMEOUT_MS, runJavascriptScript } from "./js-runtime"

type EsbuildApi = {
  initialize: (opts: {
    wasmURL: string
    worker?: boolean
  }) => Promise<void>
  transform: (
    input: string,
    options: {
      loader: "ts" | "tsx" | "js" | "jsx"
      target?: string
      format?: "iife" | "cjs" | "esm"
    }
  ) => Promise<{ code: string; warnings: Array<{ text: string }> }>
}

let esbuildReady: Promise<EsbuildApi> | null = null

/**
 * Vite/CJS interop: initialize may live on the module, .default, or .default.default.
 */
function resolveEsbuildApi(mod: unknown): EsbuildApi {
  const seen = new Set<unknown>()
  let cur: unknown = mod
  for (let i = 0; i < 4 && cur && typeof cur === "object"; i++) {
    if (seen.has(cur)) break
    seen.add(cur)
    const rec = cur as Record<string, unknown>
    if (typeof rec.initialize === "function" && typeof rec.transform === "function") {
      return rec as unknown as EsbuildApi
    }
    cur = rec.default
  }
  throw new Error(
    "esbuild-wasm: could not find initialize/transform (check import interop)"
  )
}

async function getEsbuild(
  onProgress?: (p: number, label: string) => void
): Promise<EsbuildApi> {
  if (!esbuildReady) {
    esbuildReady = (async () => {
      onProgress?.(0.1, "Loading esbuild-wasm…")
      // Prefer ESM browser build so Vite does not load Node main.js
      const mod = await import("esbuild-wasm/esm/browser.js")
      const esbuild = resolveEsbuildApi(mod)
      onProgress?.(0.4, "Initializing esbuild WASM…")
      await esbuild.initialize({
        wasmURL: ESBUILD_WASM_URL,
        // Workers unreliable in this monorepo (same as Monaco fallback)
        worker: false,
      })
      onProgress?.(1, "esbuild ready")
      return esbuild
    })().catch((err) => {
      esbuildReady = null
      throw err
    })
  }
  return esbuildReady
}

function loaderForPath(path: string): "ts" | "tsx" | "js" | "jsx" {
  if (path.endsWith(".tsx")) return "tsx"
  if (path.endsWith(".jsx")) return "jsx"
  if (path.endsWith(".ts") || path.endsWith(".mts") || path.endsWith(".cts")) {
    return "ts"
  }
  return "js"
}

/**
 * TypeScript adapter: esbuild-wasm strip/transpile → same JS runner.
 * Single-file scripts only (no npm / React for now).
 */
export function createTypescriptAdapter(): LanguageAdapter {
  return {
    id: "typescript-esbuild",
    languages: ["typescript"] as const,

    async ensureReady(_language, onProgress) {
      await getEsbuild(onProgress)
    },

    async run(req, onEvent, signal) {
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
        phase: "compiling",
        message: "Initializing…",
      })

      let jsCode: string
      try {
        const esbuild = await getEsbuild()
        const result = await esbuild.transform(source, {
          loader: loaderForPath(req.entryPath),
          target: "es2022",
          // No imports — algorithm-style scripts only
          format: "esm",
        })
        for (const w of result.warnings) {
          onEvent({ type: "stderr", chunk: `esbuild: ${w.text}\n` })
        }
        // Drop bare export/import for AsyncFunction (simple strip)
        jsCode = stripModuleSyntax(result.code)
      } catch (err) {
        const message =
          err instanceof Error ? (err.stack ?? err.message) : String(err)
        onEvent({
          type: "stderr",
          chunk: `TypeScript transpile failed:\n${message}\n`,
        })
        onEvent({ type: "exit", code: 1, durationMs: 0 })
        return
      }

      await runJavascriptScript(
        {
          source: jsCode,
          stdin: req.stdin,
          args: req.args,
          timeoutMs: req.timeoutMs ?? DEFAULT_JS_TIMEOUT_MS,
          entryLabel: req.entryPath,
          signal,
        },
        onEvent
      )
    },
  }
}

/** Remove top-level import/export so AsyncFunction can run the body. */
function stripModuleSyntax(code: string): string {
  return code
    .replace(/^\s*import\s+[^;]+;/gm, "")
    .replace(/^\s*export\s+default\s+/gm, "")
    .replace(/^\s*export\s+\{[^}]*\}\s*;?/gm, "")
    .replace(/^\s*export\s+(async\s+)?function\s+/gm, "$1function ")
    .replace(/^\s*export\s+(const|let|var|class)\s+/gm, "$1 ")
}
