import { createHash } from "node:crypto"
import type { JobSearchResult } from "@mockmatch/schemas"
import { env } from "../../config/env.js"
import { getRedis } from "../../lib/redis.js"
import { logger } from "../../lib/logger.js"

const KEY_PREFIX = "jobs:search:v1"

export function buildJobsCacheKey(
  provider: string,
  stablePayload: Record<string, unknown>
): string {
  const json = JSON.stringify(stablePayload, Object.keys(stablePayload).sort())
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 32)
  return `${KEY_PREFIX}:${provider}:${hash}`
}

export async function getCachedJobSearch(
  key: string
): Promise<JobSearchResult | null> {
  try {
    const raw = await getRedis().get(key)
    if (!raw) return null
    return JSON.parse(raw) as JobSearchResult
  } catch (error) {
    logger.warn({ err: error, key }, "jobs cache get failed")
    return null
  }
}

export async function setCachedJobSearch(
  key: string,
  value: JobSearchResult
): Promise<void> {
  try {
    const ttl = env.JOBS_CACHE_TTL_SECONDS
    await getRedis().set(key, JSON.stringify(value), "EX", ttl)
  } catch (error) {
    logger.warn({ err: error, key }, "jobs cache set failed")
  }
}
