import { Hono } from "hono"
import { db } from "../../db/client.js"
import { pingRedis } from "../../lib/auth-store.js"
import { sql } from "drizzle-orm"

export const healthRoutes = new Hono()

/** Liveness — process up (K8s livenessProbe). No dependency checks. */
healthRoutes.get("/health", (c) =>
  c.json({ status: "ok", service: "mockmatch-api" })
)

/**
 * Readiness — shared stores reachable (K8s readinessProbe).
 * Fail → pod removed from Service endpoints; other replicas keep traffic.
 */
healthRoutes.get("/ready", async (c) => {
  const checks: Record<string, "ok" | "fail"> = {
    postgres: "fail",
    redis: "fail",
  }

  try {
    await db.execute(sql`select 1`)
    checks.postgres = "ok"
  } catch {
    checks.postgres = "fail"
  }

  checks.redis = (await pingRedis()) ? "ok" : "fail"

  const ready = checks.postgres === "ok" && checks.redis === "ok"
  return c.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "mockmatch-api",
      checks,
    },
    ready ? 200 : 503
  )
})
