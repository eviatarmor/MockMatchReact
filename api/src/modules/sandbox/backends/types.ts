import type {
  SandboxBackendName,
  SandboxEnsureResult,
  SandboxExecResult,
  SandboxPtyHandlers,
  SandboxStreamHandlers,
} from "../types.js"

export type BackendEnsureOpts = {
  sessionId: string
  userId: string
}

export type BackendExecOpts = {
  sessionId: string
  userId: string
  runId: string
  argv: string[]
  label: string
  files: Record<string, string>
  timeoutMs: number
  signal: AbortSignal
  handlers: SandboxStreamHandlers
}

export type BackendPtyOpts = {
  sessionId: string
  userId: string
  files?: Record<string, string>
  cols: number
  rows: number
  handlers: SandboxPtyHandlers
}

/**
 * Isolation backend — Docker (local), Firecracker (prod), or Mock (tests).
 * Orchestrator and local service both call this interface.
 */
export interface SandboxBackend {
  readonly name: SandboxBackendName
  ensure(opts: BackendEnsureOpts): Promise<SandboxEnsureResult>
  destroy(sessionId: string): Promise<void>
  exec(opts: BackendExecOpts): Promise<SandboxExecResult>
  openPty(opts: BackendPtyOpts): Promise<{ ok: true } | { ok: false; error: string }>
  writePty(sessionId: string, userId: string, data: string): boolean
  closePty(sessionId: string, userId: string): void
  closeAllPty(sessionId: string): void
  isExecActive(sessionId: string): boolean
  abortExec(sessionId: string): void
}
