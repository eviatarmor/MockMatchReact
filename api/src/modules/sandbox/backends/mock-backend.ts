/**
 * In-memory sandbox for unit tests / CI without Docker.
 */
import { randomBytes } from "node:crypto"
import type {
  BackendEnsureOpts,
  BackendExecOpts,
  BackendPtyOpts,
  SandboxBackend,
} from "./types.js"
import type { SandboxEnsureResult, SandboxExecResult } from "../types.js"

type PtyRec = {
  sessionId: string
  userId: string
  handlers: BackendPtyOpts["handlers"]
}

export class MockSandboxBackend implements SandboxBackend {
  readonly name = "mock" as const
  private units = new Set<string>()
  private active = new Set<string>()
  private ptys = new Map<string, PtyRec>()

  async ensure(opts: BackendEnsureOpts): Promise<SandboxEnsureResult> {
    const unitId = `mock-${opts.sessionId.slice(0, 12)}`
    this.units.add(unitId)
    return {
      sessionId: opts.sessionId,
      unitId,
      backend: "mock",
      guestDir: "/workspace",
    }
  }

  async destroy(sessionId: string): Promise<void> {
    this.closeAllPty(sessionId)
    this.abortExec(sessionId)
    this.units.delete(`mock-${sessionId.slice(0, 12)}`)
  }

  isExecActive(sessionId: string): boolean {
    return this.active.has(sessionId)
  }

  abortExec(sessionId: string): void {
    this.active.delete(sessionId)
  }

  async exec(opts: BackendExecOpts): Promise<SandboxExecResult> {
    if (this.active.has(opts.sessionId)) {
      return {
        runId: opts.runId,
        exitCode: null,
        error: "A sandbox run is already in progress for this workspace.",
        command: "",
      }
    }
    this.active.add(opts.sessionId)
    try {
      await this.ensure({ sessionId: opts.sessionId, userId: opts.userId })
      await opts.handlers.onStart?.({
        runId: opts.runId,
        command: opts.label,
      })
      opts.handlers.onStdout(
        `[mock sandbox] ${opts.label}\nfiles=${Object.keys(opts.files).length}\n`
      )
      if (opts.signal.aborted) {
        return {
          runId: opts.runId,
          exitCode: null,
          error: "aborted",
          command: opts.label,
        }
      }
      return { runId: opts.runId, exitCode: 0, command: opts.label }
    } finally {
      this.active.delete(opts.sessionId)
    }
  }

  async openPty(
    opts: BackendPtyOpts
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    this.closePty(opts.sessionId, opts.userId)
    await this.ensure({ sessionId: opts.sessionId, userId: opts.userId })
    const key = `${opts.sessionId}:${opts.userId}`
    this.ptys.set(key, {
      sessionId: opts.sessionId,
      userId: opts.userId,
      handlers: opts.handlers,
    })
    opts.handlers.onData(
      `\r\n[mock sandbox] bash (not a real VM)\r\n/workspace $ `
    )
    return { ok: true }
  }

  writePty(sessionId: string, userId: string, data: string): boolean {
    const rec = this.ptys.get(`${sessionId}:${userId}`)
    if (!rec) return false
    if (data.includes("\r") || data.includes("\n")) {
      rec.handlers.onData(`\r\n[mock] ok\r\n/workspace $ `)
    }
    return true
  }

  closePty(sessionId: string, userId: string): void {
    const key = `${sessionId}:${userId}`
    const rec = this.ptys.get(key)
    if (!rec) return
    this.ptys.delete(key)
    rec.handlers.onExit(0)
  }

  closeAllPty(sessionId: string): void {
    for (const [k, rec] of [...this.ptys]) {
      if (rec.sessionId === sessionId) {
        this.closePty(sessionId, rec.userId)
        void k
      }
    }
  }
}

export function mockRunId(): string {
  return randomBytes(6).toString("hex")
}
