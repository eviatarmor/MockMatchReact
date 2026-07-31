import type { LanguageAdapter, RunRequest } from "../types"
import { DEFAULT_JS_TIMEOUT_MS, runJavascriptScript } from "./js-runtime"

/**
 * JavaScript adapter — main-thread AsyncFunction + fake console/process.
 */
export function createJavascriptAdapter(): LanguageAdapter {
  return {
    id: "javascript",
    languages: ["javascript"] as const,

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

      await runJavascriptScript(
        {
          source,
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

export function assertJavascriptRequest(req: RunRequest): void {
  if (req.language !== "javascript") {
    throw new Error(`Javascript adapter cannot run language: ${req.language}`)
  }
}
