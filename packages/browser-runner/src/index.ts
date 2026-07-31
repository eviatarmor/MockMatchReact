/**
 * @mockmatch/browser-runner
 *
 * Client-side code execution for IDE hosts.
 * WASM-first adapters; Node/web-app engines later.
 * Free-for-commercial OSS only (see README).
 */

export type {
  BrowserRunner,
  BrowserRunnerOptions,
  EnsureReadyProgress,
  LanguageAdapter,
  RunEvent,
  RunRequest,
  RunStatusPhase,
  RuntimeLanguage,
} from "./types"

export { createBrowserRunner, formatRunEventLine } from "./create-browser-runner"
export { languageFromPath, looksLikeWebAppEntry } from "./language-from-path"
export { createJavascriptAdapter } from "./adapters/javascript"
export { createUnsupportedAdapter } from "./adapters/unsupported"
export { useBrowserRunner } from "./host/use-browser-runner"
