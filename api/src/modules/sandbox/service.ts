/**
 * High-level sandbox service used by WS and orchestrator.
 * Enforces tickets, quotas, registry, audit; delegates to SandboxBackend.
 */
import { randomBytes } from "node:crypto"
import { env } from "../../config/env.js"
import { auditSandbox } from "./audit.js"
import { buildSandboxCommand } from "./command.js"
import {
  checkCreateQuota,
  checkExecQuota,
  recordCreate,
  recordExec,
} from "./quotas.js"
import {
  defaultExpiresAt,
  deleteSessionRecord,
  getSessionRecord,
  putSessionRecord,
  touchSessionRecord,
} from "./registry.js"
import {
  ticketHasScope,
  verifySandboxTicket,
  type SandboxTicketPayload,
} from "./tickets.js"
import type { SandboxBackend } from "./backends/types.js"
import { getLocalSandboxBackend } from "./backends/index.js"
import { nodeId } from "./ids.js"
import type {
  SandboxExecRequest,
  SandboxExecResult,
  SandboxPtyOpenRequest,
  SandboxStreamHandlers,
} from "./types.js"

const RUN_TIMEOUT_MS = 30_000

export function isSandboxEnabled(): boolean {
  return Boolean(env.SANDBOX_CONTAINER_PREFIX?.trim())
}

export class SandboxService {
  constructor(private readonly backend: SandboxBackend) {}

  isExecActive(sessionId: string): boolean {
    return this.backend.isExecActive(sessionId)
  }

  abortExec(sessionId: string): void {
    this.backend.abortExec(sessionId)
  }

  closePty(sessionId: string, userId: string): void {
    this.backend.closePty(sessionId, userId)
  }

  closeAllPty(sessionId: string): void {
    this.backend.closeAllPty(sessionId)
  }

  writePty(sessionId: string, userId: string, data: string): boolean {
    return this.backend.writePty(sessionId, userId, data)
  }

  private async requireTicket(
    ticket: string | undefined,
    sessionId: string,
    userId: string,
    scope: "run" | "pty"
  ): Promise<SandboxTicketPayload | null> {
    const required =
      env.SANDBOX_REQUIRE_TICKETS || env.NODE_ENV === "production"
    // Local dev: tickets optional when SANDBOX_REQUIRE_TICKETS=false
    if (!required) {
      if (!ticket) return null
    }
    if (!ticket) {
      throw new Error("Sandbox ticket required")
    }
    const payload = await verifySandboxTicket(ticket)
    if (payload.sub !== userId || payload.sid !== sessionId) {
      throw new Error("Sandbox ticket subject/session mismatch")
    }
    if (!ticketHasScope(payload, scope)) {
      throw new Error(`Sandbox ticket missing scope: ${scope}`)
    }
    return payload
  }

  async ensureSession(input: {
    sessionId: string
    userId: string
    ticket?: string
  }): Promise<void> {
    if (!isSandboxEnabled()) {
      throw new Error("Sandbox disabled")
    }
    try {
      await this.requireTicket(
        input.ticket,
        input.sessionId,
        input.userId,
        "run"
      )
    } catch (err) {
      await auditSandbox({
        action: "ticket_deny",
        sessionId: input.sessionId,
        userId: input.userId,
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
      throw err
    }

    const existing = await getSessionRecord(input.sessionId)
    if (existing && existing.state === "ready") {
      await touchSessionRecord(input.sessionId)
      return
    }

    const quota = await checkCreateQuota(input.userId)
    if (!quota.ok) {
      await auditSandbox({
        action: "quota_deny",
        sessionId: input.sessionId,
        userId: input.userId,
        ok: false,
        detail: quota.reason,
      })
      throw new Error(quota.reason)
    }

    const ensured = await this.backend.ensure({
      sessionId: input.sessionId,
      userId: input.userId,
    })
    await recordCreate(input.userId)
    await putSessionRecord({
      sessionId: input.sessionId,
      userId: input.userId,
      backend: ensured.backend,
      unitId: ensured.unitId,
      nodeId: nodeId(),
      state: "ready",
      createdAt: Date.now(),
      expiresAt: defaultExpiresAt(),
      lastUsedAt: Date.now(),
    })
    await auditSandbox({
      action: "ensure",
      sessionId: input.sessionId,
      userId: input.userId,
      backend: ensured.backend,
      unitId: ensured.unitId,
      nodeId: nodeId(),
      ok: true,
    })
  }

  async destroySession(input: {
    sessionId: string
    userId?: string
  }): Promise<void> {
    this.backend.closeAllPty(input.sessionId)
    this.backend.abortExec(input.sessionId)
    await this.backend.destroy(input.sessionId)
    await deleteSessionRecord(input.sessionId, input.userId)
    await auditSandbox({
      action: "destroy",
      sessionId: input.sessionId,
      userId: input.userId,
      ok: true,
    })
  }

  async executeRun(
    req: SandboxExecRequest,
    handlers: SandboxStreamHandlers
  ): Promise<SandboxExecResult> {
    const runId = randomBytes(6).toString("hex")
    if (!isSandboxEnabled()) {
      return {
        runId,
        exitCode: null,
        error: "Sandbox disabled",
        command: "",
      }
    }
    try {
      await this.requireTicket(req.ticket, req.sessionId, req.userId, "run")
    } catch (err) {
      await auditSandbox({
        action: "ticket_deny",
        sessionId: req.sessionId,
        userId: req.userId,
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
      return {
        runId,
        exitCode: null,
        error: err instanceof Error ? err.message : String(err),
        command: "",
      }
    }

    const eq = await checkExecQuota(req.userId)
    if (!eq.ok) {
      await auditSandbox({
        action: "quota_deny",
        sessionId: req.sessionId,
        userId: req.userId,
        ok: false,
        detail: eq.reason,
      })
      return { runId, exitCode: null, error: eq.reason, command: "" }
    }

    if (this.backend.isExecActive(req.sessionId)) {
      return {
        runId,
        exitCode: null,
        error: "A sandbox run is already in progress for this workspace.",
        command: "",
      }
    }

    const cmd = buildSandboxCommand(req.mode, req.files, req.entryPath)
    if ("error" in cmd) {
      return { runId, exitCode: null, error: cmd.error, command: "" }
    }

    try {
      await this.ensureSession({
        sessionId: req.sessionId,
        userId: req.userId,
        ticket: req.ticket,
      })
      await recordExec(req.userId)
      const ac = new AbortController()
      const result = await this.backend.exec({
        sessionId: req.sessionId,
        userId: req.userId,
        runId,
        argv: cmd.argv,
        label: cmd.label,
        files: req.files,
        timeoutMs: RUN_TIMEOUT_MS,
        signal: ac.signal,
        handlers,
      })
      await touchSessionRecord(req.sessionId)
      await auditSandbox({
        action: "exec",
        sessionId: req.sessionId,
        userId: req.userId,
        ok: result.exitCode === 0,
        exitCode: result.exitCode,
        detail: result.error ?? cmd.label,
        bytesIn: Object.values(req.files).reduce((n, s) => n + s.length, 0),
      })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await auditSandbox({
        action: "exec",
        sessionId: req.sessionId,
        userId: req.userId,
        ok: false,
        detail: message,
      })
      return { runId, exitCode: null, error: message, command: cmd.label }
    }
  }

  async openPty(opts: SandboxPtyOpenRequest) {
    if (!isSandboxEnabled()) {
      return { ok: false as const, error: "Sandbox disabled" }
    }
    try {
      await this.requireTicket(
        opts.ticket,
        opts.sessionId,
        opts.userId,
        "pty"
      )
    } catch (err) {
      await auditSandbox({
        action: "ticket_deny",
        sessionId: opts.sessionId,
        userId: opts.userId,
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      }
    }

    try {
      await this.ensureSession({
        sessionId: opts.sessionId,
        userId: opts.userId,
        ticket: opts.ticket,
      })
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      }
    }

    const cols = Math.min(300, Math.max(20, Math.floor(opts.cols ?? 80)))
    const rows = Math.min(100, Math.max(5, Math.floor(opts.rows ?? 24)))
    const result = await this.backend.openPty({
      sessionId: opts.sessionId,
      userId: opts.userId,
      files: opts.files,
      cols,
      rows,
      handlers: opts.handlers,
    })
    await auditSandbox({
      action: "pty_open",
      sessionId: opts.sessionId,
      userId: opts.userId,
      ok: result.ok,
      detail: result.ok ? undefined : result.error,
    })
    return result
  }
}

let localService: SandboxService | null = null

export function getLocalSandboxService(): SandboxService {
  if (!localService) {
    localService = new SandboxService(getLocalSandboxBackend())
  }
  return localService
}
