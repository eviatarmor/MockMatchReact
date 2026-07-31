import type { LanguageAdapter, RuntimeLanguage } from "../types"

const MESSAGES: Partial<Record<RuntimeLanguage, string>> = {
  go: "Go runtime is not available yet (planned: TinyGo WASI or Linux-in-browser).",
  rust: "Rust runtime is not available yet (planned: Linux-in-browser toolchain).",
  java: "Java runtime is not available yet (planned: JDK in browser Linux VM).",
  csharp: "C# runtime is not available yet (planned: .NET in browser Linux VM).",
  nodejs:
    "Node.js / React / Angular web-app runtime is not available yet (planned: Sandpack or Linux+Node phase).",
}

/**
 * Stub adapter that prints a clear “not yet” message for deferred languages.
 */
export function createUnsupportedAdapter(
  languages: readonly RuntimeLanguage[]
): LanguageAdapter {
  return {
    id: `unsupported:${languages.join(",")}`,
    languages,
    async run(req, onEvent) {
      const msg =
        MESSAGES[req.language] ??
        `No browser runtime registered for language: ${req.language}`
      onEvent({
        type: "status",
        phase: "error",
        message: msg,
      })
      onEvent({ type: "stderr", chunk: `${msg}\n` })
      onEvent({ type: "exit", code: 1, durationMs: 0 })
    },
  }
}
