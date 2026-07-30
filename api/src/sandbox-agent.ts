/**
 * Sandbox Agent — runs on dedicated sandbox nodes.
 * For now reuses orchestrator app (same HTTP) with node-local backend.
 * Future: vsock to Firecracker guests; no cluster credentials on this host
 * beyond Redis for registry optional.
 */
import { serve } from "@hono/node-server"
import { env } from "./config/env.js"
import { logger } from "./lib/logger.js"
import { createOrchestratorApp } from "./modules/sandbox/orchestrator-app.js"
import { ensureFirecrackerLatest } from "./modules/sandbox/firecracker-install.js"

const port = env.SANDBOX_AGENT_PORT

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
        nodeId: env.SANDBOX_NODE_ID || "agent",
        role: "sandbox-agent",
      },
      "sandbox agent listening"
    )
  })
}

void main()
