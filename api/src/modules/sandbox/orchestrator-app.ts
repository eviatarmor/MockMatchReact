/**
 * Internal Sandbox Orchestrator HTTP API (not public).
 * Creates/destroys/execs via local backend (Docker or Firecracker agent helper).
 */
import { Hono } from "hono"
import { env } from "../../config/env.js"
import { logger } from "../../lib/logger.js"
import { recentSandboxAudit } from "./audit.js"
import {
  createSessionBodySchema,
  destroySessionBodySchema,
  execBodySchema,
} from "./types.js"
import { getLocalSandboxService, isSandboxEnabled } from "./service.js"
import { listExpiredSessionIds } from "./registry.js"

export function createOrchestratorApp() {
  const app = new Hono()
  const svc = getLocalSandboxService()

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "sandbox-orchestrator",
      backend: env.SANDBOX_BACKEND,
      enabled: isSandboxEnabled(),
      nodeId: env.SANDBOX_NODE_ID || "local",
    })
  )

  app.get("/ready", async (c) => {
    if (!isSandboxEnabled()) {
      return c.json({ ok: false, reason: "sandbox disabled" }, 503)
    }
    return c.json({ ok: true, backend: env.SANDBOX_BACKEND })
  })

  app.get("/v1/audit", async (c) => {
    const events = await recentSandboxAudit(100)
    return c.json({ events })
  })

  app.post("/v1/sessions/create", async (c) => {
    const body = createSessionBodySchema.parse(await c.req.json())
    try {
      await svc.ensureSession({
        sessionId: body.sessionId,
        userId: body.userId,
        ticket: body.ticket,
      })
      return c.json({ ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return c.json({ ok: false, error: message }, 400)
    }
  })

  app.post("/v1/sessions/destroy", async (c) => {
    const body = destroySessionBodySchema.parse(await c.req.json())
    await svc.destroySession({
      sessionId: body.sessionId,
      userId: body.userId,
    })
    return c.json({ ok: true })
  })

  app.post("/v1/exec", async (c) => {
    const body = execBodySchema.parse(await c.req.json())
    const chunks: { type: string; chunk?: string; runId?: string; command?: string }[] =
      []
    const result = await svc.executeRun(
      {
        sessionId: body.sessionId,
        userId: body.userId,
        ticket: body.ticket,
        mode: body.mode,
        entryPath: body.entryPath,
        files: body.files,
      },
      {
        onStart: async ({ runId, command }) => {
          chunks.push({ type: "start", runId, command })
        },
        onStdout: (chunk) => {
          chunks.push({ type: "stdout", chunk })
        },
        onStderr: (chunk) => {
          chunks.push({ type: "stderr", chunk })
        },
      }
    )
    // NDJSON body for streaming clients; also includes final result fields
    const lines = [
      ...chunks.map((m) => JSON.stringify(m)),
      JSON.stringify({
        type: "done",
        runId: result.runId,
        exitCode: result.exitCode,
        error: result.error,
        command: result.command,
      }),
    ]
    return c.body(lines.join("\n") + "\n", 200, {
      "content-type": "application/x-ndjson",
    })
  })

  app.post("/v1/reap", async (c) => {
    const ids = await listExpiredSessionIds()
    let n = 0
    for (const id of ids) {
      try {
        await svc.destroySession({ sessionId: id })
        n++
      } catch (err) {
        logger.warn({ err, id }, "reap failed")
      }
    }
    return c.json({ reaped: n })
  })

  return app
}
