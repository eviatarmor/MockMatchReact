/**
 * Sandbox run facade — delegates to multi-tenant sandbox module.
 */
import {
  sanitizeSandboxFiles,
  syncFilesToHost,
} from "../modules/sandbox/files.js"
import {
  sandboxAbortExec,
  sandboxExecuteRun,
  sandboxIsExecActive,
  mintSandboxTicket,
} from "../modules/sandbox/client.js"
import type { SandboxMode } from "../modules/sandbox/types.js"
import { resolveSessionPaths } from "./sandbox-session.js"

export type { SandboxMode }
export { sanitizeSandboxFiles, syncFilesToHost }

export type SandboxRunRequest = {
  sessionId: string
  userId?: string
  role?: "owner" | "edit" | "view"
  mode: SandboxMode
  entryPath?: string
  files: Record<string, string>
  ticket?: string
}

export type SandboxRunResult = {
  runId: string
  exitCode: number | null
  error?: string
  command: string
}

export function isSandboxRunActive(sessionId: string): boolean {
  return sandboxIsExecActive(sessionId)
}

export function abortSandboxRun(sessionId: string): void {
  sandboxAbortExec(sessionId)
}

export function resolveGuestSessionDir(sessionId: string): {
  hostDir: string
  guestDir: string
} {
  const p = resolveSessionPaths(sessionId)
  return { hostDir: p.hostDir, guestDir: p.guestDir }
}

type StreamHandlers = {
  onStart?: (info: {
    runId: string
    command: string
  }) => void | Promise<void>
  onStdout: (chunk: string) => void
  onStderr: (chunk: string) => void
}

export async function executeSandboxRun(
  req: SandboxRunRequest,
  handlers: StreamHandlers
): Promise<SandboxRunResult> {
  const userId = req.userId ?? "system"
  const role = req.role ?? "owner"
  const ticket =
    req.ticket ??
    (await mintSandboxTicket({
      userId,
      sessionId: req.sessionId,
      role,
    }))
  return sandboxExecuteRun(
    {
      sessionId: req.sessionId,
      userId,
      mode: req.mode,
      entryPath: req.entryPath,
      files: req.files,
      ticket,
    },
    handlers
  )
}
