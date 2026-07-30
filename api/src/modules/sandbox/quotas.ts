/**
 * Per-tenant sandbox quotas (Redis counters).
 */
import { getRedis } from "../../lib/redis.js"
import { env } from "../../config/env.js"
import { countUserSessions } from "./registry.js"

const hourBucket = () => Math.floor(Date.now() / 3_600_000)
const createsKey = (userId: string) =>
  `sandbox:quota:creates:${userId}:${hourBucket()}`
const execKey = (userId: string) =>
  `sandbox:quota:exec:${userId}:${hourBucket()}`

export type QuotaCheck =
  | { ok: true }
  | { ok: false; reason: string }

export async function checkCreateQuota(userId: string): Promise<QuotaCheck> {
  const concurrent = await countUserSessions(userId)
  if (concurrent >= env.SANDBOX_MAX_CONCURRENT_PER_USER) {
    return {
      ok: false,
      reason: `Sandbox concurrent limit (${env.SANDBOX_MAX_CONCURRENT_PER_USER}) reached`,
    }
  }
  const creates = Number((await getRedis().get(createsKey(userId))) ?? "0")
  if (creates >= env.SANDBOX_MAX_CREATES_PER_USER_HOUR) {
    return {
      ok: false,
      reason: `Sandbox create rate limit (${env.SANDBOX_MAX_CREATES_PER_USER_HOUR}/hour)`,
    }
  }
  return { ok: true }
}

export async function recordCreate(userId: string): Promise<void> {
  const redis = getRedis()
  const k = createsKey(userId)
  const n = await redis.incr(k)
  if (n === 1) await redis.expire(k, 3700)
}

export async function checkExecQuota(userId: string): Promise<QuotaCheck> {
  const n = Number((await getRedis().get(execKey(userId))) ?? "0")
  if (n >= env.SANDBOX_MAX_EXECS_PER_USER_HOUR) {
    return {
      ok: false,
      reason: `Sandbox exec rate limit (${env.SANDBOX_MAX_EXECS_PER_USER_HOUR}/hour)`,
    }
  }
  return { ok: true }
}

export async function recordExec(userId: string): Promise<void> {
  const redis = getRedis()
  const k = execKey(userId)
  const n = await redis.incr(k)
  if (n === 1) await redis.expire(k, 3700)
}
