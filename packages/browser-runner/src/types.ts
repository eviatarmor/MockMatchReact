/** Languages the registry knows about (not all have adapters yet). */
export type RuntimeLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "c"
  | "cpp"
  | "go"
  | "rust"
  | "java"
  | "csharp"
  | "nodejs"

export type RunRequest = {
  language: RuntimeLanguage
  /** path → source text */
  files: Record<string, string>
  /** Entry file path (must exist in `files`) */
  entryPath: string
  args?: string[]
  stdin?: string
  /** Default 15_000 */
  timeoutMs?: number
  tests?: Array<{
    name: string
    stdin?: string
    expectedStdout?: string
  }>
}

export type RunStatusPhase =
  | "loading"
  | "compiling"
  | "running"
  | "done"
  | "error"

export type RunEvent =
  | {
      type: "status"
      phase: RunStatusPhase
      message?: string
    }
  | { type: "stdout"; chunk: string }
  | { type: "stderr"; chunk: string }
  | { type: "exit"; code: number; durationMs: number }
  | {
      type: "test-result"
      name: string
      pass: boolean
      actual?: string
      expected?: string
    }

export type EnsureReadyProgress = (progress: number, label: string) => void

export interface LanguageAdapter {
  readonly id: string
  readonly languages: readonly RuntimeLanguage[]
  ensureReady?(
    language: RuntimeLanguage,
    onProgress?: EnsureReadyProgress
  ): Promise<void>
  run(
    req: RunRequest,
    onEvent: (e: RunEvent) => void,
    signal?: AbortSignal
  ): Promise<void>
  dispose?(): void
}

export interface BrowserRunner {
  /** Languages that currently have a working adapter. */
  supportedLanguages(): RuntimeLanguage[]
  /** Whether `language` can run now (not just stubbed). */
  isSupported(language: RuntimeLanguage): boolean
  ensureReady(
    language: RuntimeLanguage,
    onProgress?: EnsureReadyProgress
  ): Promise<void>
  run(
    req: RunRequest,
    onEvent: (e: RunEvent) => void,
    signal?: AbortSignal
  ): Promise<void>
  dispose(): void
}

export type BrowserRunnerOptions = {
  /** Override default adapters (tests / advanced hosts). */
  adapters?: LanguageAdapter[]
}
