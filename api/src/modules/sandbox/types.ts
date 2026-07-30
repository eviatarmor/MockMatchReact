/**
 * Sandbox isolation contract (multi-tenant production ready).
 * App-facing WS protocol stays stable; internals use this module.
 */
import { z } from "zod"

export const sandboxBackendSchema = z.enum(["docker", "firecracker", "mock"])
export type SandboxBackendName = z.infer<typeof sandboxBackendSchema>

export const sandboxModeSchema = z.enum(["run", "tests"])
export type SandboxMode = z.infer<typeof sandboxModeSchema>

export const sandboxScopeSchema = z.enum(["run", "pty"])
export type SandboxScope = z.infer<typeof sandboxScopeSchema>

export type SandboxSessionRecord = {
  sessionId: string
  userId: string
  backend: SandboxBackendName
  /** Opaque unit id (container name, VM id, mock id). */
  unitId: string
  nodeId: string
  state: "creating" | "ready" | "busy" | "destroying" | "dead"
  createdAt: number
  expiresAt: number
  lastUsedAt: number
}

export type SandboxEnsureResult = {
  sessionId: string
  unitId: string
  backend: SandboxBackendName
  guestDir: "/workspace"
}

export type SandboxExecRequest = {
  sessionId: string
  userId: string
  mode: SandboxMode
  entryPath?: string
  files: Record<string, string>
  ticket?: string
}

export type SandboxExecResult = {
  runId: string
  exitCode: number | null
  error?: string
  command: string
}

export type SandboxStreamHandlers = {
  onStart?: (info: { runId: string; command: string }) => void | Promise<void>
  onStdout: (chunk: string) => void
  onStderr: (chunk: string) => void
}

export type SandboxPtyHandlers = {
  onData: (chunk: string) => void
  onExit: (code: number | null) => void
  onError: (message: string) => void
}

export type SandboxPtyOpenRequest = {
  sessionId: string
  userId: string
  files?: Record<string, string>
  cols?: number
  rows?: number
  ticket?: string
  handlers: SandboxPtyHandlers
}

/** Internal orchestrator HTTP shapes */
export const createSessionBodySchema = z.object({
  sessionId: z.string().min(1).max(128),
  userId: z.string().min(1).max(128),
  ticket: z.string().min(1),
})

export const destroySessionBodySchema = z.object({
  sessionId: z.string().min(1).max(128),
  userId: z.string().min(1).max(128),
  ticket: z.string().optional(),
})

export const execBodySchema = z.object({
  sessionId: z.string().min(1).max(128),
  userId: z.string().min(1).max(128),
  ticket: z.string().min(1),
  mode: sandboxModeSchema,
  entryPath: z.string().optional(),
  files: z.record(z.string(), z.string()),
  runId: z.string().optional(),
})

export const ptyOpenBodySchema = z.object({
  sessionId: z.string().min(1).max(128),
  userId: z.string().min(1).max(128),
  ticket: z.string().min(1),
  cols: z.number().int().optional(),
  rows: z.number().int().optional(),
  files: z.record(z.string(), z.string()).optional(),
})

export type AuditAction =
  | "ensure"
  | "destroy"
  | "exec"
  | "pty_open"
  | "pty_close"
  | "quota_deny"
  | "ticket_deny"
  | "reap"

export type AuditEvent = {
  at: string
  action: AuditAction
  sessionId: string
  userId?: string
  backend?: string
  unitId?: string
  nodeId?: string
  ok: boolean
  detail?: string
  bytesIn?: number
  exitCode?: number | null
}
