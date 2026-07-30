/**
 * Redis sandbox session registry — multi-replica safe source of truth.
 */
import { getRedis } from "../../lib/redis.js"
import { env } from "../../config/env.js"
import type { SandboxSessionRecord } from "./types.js"

const key = (sessionId: string) => `sandbox:sess:${sessionId}`
const userIndex = (userId: string) => `sandbox:user:${userId}`

export async function getSessionRecord(
  sessionId: string
): Promise<SandboxSessionRecord | null> {
  const raw = await getRedis().get(key(sessionId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as SandboxSessionRecord
  } catch {
    return null
  }
}

export async function putSessionRecord(
  record: SandboxSessionRecord
): Promise<void> {
  const redis = getRedis()
  const ttl = Math.max(
    60,
    Math.ceil((record.expiresAt - Date.now()) / 1000)
  )
  const pipe = redis.pipeline()
  pipe.set(key(record.sessionId), JSON.stringify(record), "EX", ttl)
  pipe.sadd(userIndex(record.userId), record.sessionId)
  pipe.expire(userIndex(record.userId), ttl)
  await pipe.exec()
}

export async function touchSessionRecord(sessionId: string): Promise<void> {
  const rec = await getSessionRecord(sessionId)
  if (!rec) return
  rec.lastUsedAt = Date.now()
  await putSessionRecord(rec)
}

export async function deleteSessionRecord(
  sessionId: string,
  userId?: string
): Promise<void> {
  const redis = getRedis()
  const rec = userId ? null : await getSessionRecord(sessionId)
  const uid = userId ?? rec?.userId
  const pipe = redis.pipeline()
  pipe.del(key(sessionId))
  if (uid) pipe.srem(userIndex(uid), sessionId)
  await pipe.exec()
}

export async function listUserSessions(
  userId: string
): Promise<string[]> {
  return getRedis().smembers(userIndex(userId))
}

export async function countUserSessions(userId: string): Promise<number> {
  return getRedis().scard(userIndex(userId))
}

/** Scan + reap expired records (best-effort; keys also have Redis TTL). */
export async function listExpiredSessionIds(
  limit = 200
): Promise<string[]> {
  const redis = getRedis()
  const out: string[] = []
  let cursor = "0"
  do {
    const [next, keys] = await redis.scan(
      cursor,
      "MATCH",
      "sandbox:sess:*",
      "COUNT",
      50
    )
    cursor = next
    for (const k of keys) {
      const raw = await redis.get(k)
      if (!raw) continue
      try {
        const rec = JSON.parse(raw) as SandboxSessionRecord
        if (rec.expiresAt <= Date.now() || rec.state === "dead") {
          out.push(rec.sessionId)
          if (out.length >= limit) return out
        }
      } catch {
        // ignore
      }
    }
  } while (cursor !== "0")
  return out
}

export function defaultExpiresAt(): number {
  return Date.now() + env.SANDBOX_MAX_SESSION_TTL_SECONDS * 1000
}
