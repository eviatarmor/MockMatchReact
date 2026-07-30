/**
 * Sandbox Orchestrator process — sole owner of guest create/exec in production.
 * api/ws call this over SANDBOX_ORCHESTRATOR_URL; they never open Docker.
 */
import { serve } from "@hono/node-server"
import { env } from "./config/env.js"
import { logger } from "./lib/logger.js"
import { createOrchestratorApp } from "./modules/sandbox/orchestrator-app.js"
import { getLocalSandboxService } from "./modules/sandbox/service.js"
import { listExpiredSessionIds } from "./modules/sandbox/registry.js"
import { ensureFirecrackerLatest } from "./modules/sandbox/firecracker-install.js"

const port = env.SANDBOX_ORCHESTRATOR_PORT

async function main() {
  if (env.SANDBOX_BACKEND === "firecracker" && env.SANDBOX_FIRECRACKER_AUTO_UPDATE) {
    const r = await ensureFirecrackerLatest()
    if (!r.ok) {
      logger.error({ err: r.error }, "Firecracker auto-update failed")
    } else {
      logger.info({ version: r.version }, "Firecracker is latest")
    }
  }

  const app = createOrchestratorApp()
  serve({ fetch: app.fetch, port }, (info) => {
    logger.info(
      {
        port: info.port,
        backend: env.SANDBOX_BACKEND,
        nodeId: env.SANDBOX_NODE_ID || "local",
      },
      "sandbox orchestrator listening"
    )
  })

  // Idle / expired reaper
  const REAP_MS = Math.max(30_000, env.SANDBOX_REAP_INTERVAL_SECONDS * 1000)
  setInterval(() => {
    void (async () => {
      try {
        const ids = await listExpiredSessionIds(50)
        const svc = getLocalSandboxService()
        for (const id of ids) {
          await svc.destroySession({ sessionId: id })
        }
        if (ids.length > 0) {
          logger.info({ count: ids.length }, "sandbox reaper destroyed sessions")
        }
      } catch (err) {
        logger.warn({ err }, "sandbox reaper error")
      }
    })()
  }, REAP_MS)

  // Periodic Firecracker latest check (every 6h when auto-update on)
  if (env.SANDBOX_BACKEND === "firecracker" && env.SANDBOX_FIRECRACKER_AUTO_UPDATE) {
    const SIX_H = 6 * 60 * 60 * 1000
    setInterval(() => {
      void ensureFirecrackerLatest().then((r) => {
        if (r.ok) {
          logger.info({ version: r.version }, "Firecracker auto-update check")
        } else {
          logger.warn({ err: r.error }, "Firecracker auto-update check failed")
        }
      })
    }, SIX_H)
  }
}

void main()
