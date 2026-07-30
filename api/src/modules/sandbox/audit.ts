/**
 * Structured sandbox audit log (stdout via pino + Redis ring buffer).
 */
import { getRedis } from "../../lib/redis.js"
import { logger } from "../../lib/logger.js"
import type { AuditEvent } from "./types.js"

const AUDIT_LIST = "sandbox:audit"
const AUDIT_MAX = 5_000

export async function auditSandbox(event: Omit<AuditEvent, "at">): Promise<void> {
  const full: AuditEvent = {
    ...event,
    at: new Date().toISOString(),
  }
  logger.info({ sandboxAudit: full }, `sandbox.${full.action}`)
  try {
    const redis = getRedis()
    await redis.lpush(AUDIT_LIST, JSON.stringify(full))
    await redis.ltrim(AUDIT_LIST, 0, AUDIT_MAX - 1)
  } catch (err) {
    logger.warn({ err }, "sandbox audit redis write failed")
  }
}

export async function recentSandboxAudit(limit = 50): Promise<AuditEvent[]> {
  const raw = await getRedis().lrange(AUDIT_LIST, 0, limit - 1)
  return raw
    .map((s) => {
      try {
        return JSON.parse(s) as AuditEvent
      } catch {
        return null
      }
    })
    .filter((x): x is AuditEvent => x != null)
}
