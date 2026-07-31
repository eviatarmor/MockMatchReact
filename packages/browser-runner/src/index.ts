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
export { createTypescriptAdapter } from "./adapters/typescript-esbuild"
export { createPythonAdapter } from "./adapters/python-pyodide"
export { createUnsupportedAdapter } from "./adapters/unsupported"
export {
  ESBUILD_WASM_URL,
  ESBUILD_WASM_VERSION,
  PYODIDE_INDEX_URL,
  PYODIDE_MODULE_URL,
  PYODIDE_VERSION,
} from "./assets/manifest"
export { useBrowserRunner } from "./host/use-browser-runner"
