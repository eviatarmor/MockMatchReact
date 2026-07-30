/**
 * WS/app-tier client: local in-process service OR remote orchestrator HTTP.
 * Production: SANDBOX_ORCHESTRATOR_URL set → no Docker on this process.
 */
import { env } from "../../config/env.js"
import { logger } from "../../lib/logger.js"
import { getLocalSandboxService, isSandboxEnabled } from "./service.js"
import { signSandboxTicket } from "./tickets.js"
import type { CollabEffectiveRole } from "@mockmatch/schemas"
import type {
  SandboxExecRequest,
  SandboxExecResult,
  SandboxPtyHandlers,
  SandboxStreamHandlers,
} from "./types.js"

export { isSandboxEnabled }

export async function mintSandboxTicket(input: {
  userId: string
  sessionId: string
  role: CollabEffectiveRole
}): Promise<string | undefined> {
  if (!env.SANDBOX_REQUIRE_TICKETS && env.NODE_ENV !== "production") {
    // Still mint when possible so orchestrator path works
  }
  try {
    return await signSandboxTicket(input)
  } catch (err) {
    logger.warn({ err }, "failed to mint sandbox ticket")
    return undefined
  }
}

function orchestratorUrl(): string {
  return env.SANDBOX_ORCHESTRATOR_URL.replace(/\/$/, "")
}

function useRemote(): boolean {
  return Boolean(env.SANDBOX_ORCHESTRATOR_URL.trim())
}

/** Production guard: app pods must not touch Docker when remote is required. */
export function assertAppTierSandboxConfig(): void {
  if (env.NODE_ENV !== "production") return
  if (!isSandboxEnabled()) return
  if (!env.SANDBOX_ORCHESTRATOR_URL.trim()) {
    throw new Error(
      "Production requires SANDBOX_ORCHESTRATOR_URL (Docker must not run on api/ws pods)"
    )
  }
  if (env.SANDBOX_ALLOW_INPROCESS_DOCKER_IN_PROD) {
    logger.warn(
      "SANDBOX_ALLOW_INPROCESS_DOCKER_IN_PROD is set — not multi-tenant safe"
    )
  }
}

export async function sandboxExecuteRun(
  req: SandboxExecRequest,
  handlers: SandboxStreamHandlers
): Promise<SandboxExecResult> {
  if (useRemote()) {
    return remoteExec(req, handlers)
  }
  return getLocalSandboxService().executeRun(req, handlers)
}

export async function sandboxDestroy(sessionId: string, userId?: string) {
  if (useRemote()) {
    try {
      await fetch(`${orchestratorUrl()}/v1/sessions/destroy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, userId }),
      })
    } catch (err) {
      logger.warn({ err, sessionId }, "remote sandbox destroy failed")
    }
    return
  }
  await getLocalSandboxService().destroySession({ sessionId, userId })
}

export function sandboxIsExecActive(sessionId: string): boolean {
  if (useRemote()) return false // remote busy reported via API; local map only
  return getLocalSandboxService().isExecActive(sessionId)
}

export function sandboxAbortExec(sessionId: string): void {
  if (useRemote()) return
  getLocalSandboxService().abortExec(sessionId)
}

export async function sandboxOpenPty(opts: {
  sessionId: string
  userId: string
  role: CollabEffectiveRole
  files?: Record<string, string>
  cols?: number
  rows?: number
  handlers: SandboxPtyHandlers
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ticket = await mintSandboxTicket({
    userId: opts.userId,
    sessionId: opts.sessionId,
    role: opts.role,
  })
  if (useRemote()) {
    // Remote PTY: orchestrator opens stream; for MVP we fall back to error if
    // streaming HTTP not upgraded — use local when remote PTY unsupported.
    if (!env.SANDBOX_REMOTE_PTY) {
      return {
        ok: false,
        error:
          "Remote PTY not enabled (set SANDBOX_REMOTE_PTY=1 when orchestrator supports it). Use in-process backend for PTY in dev.",
      }
    }
  }
  return getLocalSandboxService().openPty({
    sessionId: opts.sessionId,
    userId: opts.userId,
    files: opts.files,
    cols: opts.cols,
    rows: opts.rows,
    ticket,
    handlers: opts.handlers,
  })
}

export function sandboxWritePty(
  sessionId: string,
  userId: string,
  data: string
): boolean {
  return getLocalSandboxService().writePty(sessionId, userId, data)
}

export function sandboxClosePty(sessionId: string, userId: string): void {
  getLocalSandboxService().closePty(sessionId, userId)
}

export function sandboxCloseAllPty(sessionId: string): void {
  getLocalSandboxService().closeAllPty(sessionId)
}

async function remoteExec(
  req: SandboxExecRequest,
  handlers: SandboxStreamHandlers
): Promise<SandboxExecResult> {
  const ticket =
    req.ticket ??
    (await mintSandboxTicket({
      userId: req.userId,
      sessionId: req.sessionId,
      role: "owner",
    }))
  if (!ticket) {
    return {
      runId: "none",
      exitCode: null,
      error: "Failed to mint sandbox ticket",
      command: "",
    }
  }

  const res = await fetch(`${orchestratorUrl()}/v1/exec`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...req, ticket }),
  })
  const text = await res.text()
  if (!res.ok) {
    return {
      runId: "none",
      exitCode: null,
      error: `Orchestrator error ${res.status}: ${text}`,
      command: "",
    }
  }
  // NDJSON: start / stdout / stderr / done
  let result: SandboxExecResult = {
    runId: "pending",
    exitCode: null,
    command: "",
  }
  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    try {
      const msg = JSON.parse(line) as {
        type: string
        runId?: string
        command?: string
        chunk?: string
        exitCode?: number | null
        error?: string
      }
      if (msg.type === "start") {
        result.runId = msg.runId ?? result.runId
        result.command = msg.command ?? ""
        await handlers.onStart?.({
          runId: result.runId,
          command: result.command,
        })
      } else if (msg.type === "stdout" && msg.chunk) {
        handlers.onStdout(msg.chunk)
      } else if (msg.type === "stderr" && msg.chunk) {
        handlers.onStderr(msg.chunk)
      } else if (msg.type === "done") {
        result = {
          runId: msg.runId ?? result.runId,
          exitCode: msg.exitCode ?? null,
          error: msg.error,
          command: msg.command ?? result.command,
        }
      }
    } catch {
      // ignore bad line
    }
  }
  return result
}
