import { getRedis } from "./redis.js"

const OTP_PREFIX = "auth:otp"
const REFRESH_PREFIX = "auth:refresh"
const REFRESH_USER_PREFIX = "auth:refresh:user"

export interface OtpChallengeRecord {
  codeHash: string
  purpose: string
  fullName: string | null
  attempts: number
}

export interface RefreshRecord {
  userId: string
}

function otpKey(purpose: string, email: string): string {
  return `${OTP_PREFIX}:${purpose}:${email}`
}

function refreshKey(tokenHash: string): string {
  return `${REFRESH_PREFIX}:${tokenHash}`
}

function refreshUserKey(userId: string): string {
  return `${REFRESH_USER_PREFIX}:${userId}`
}

/** Replace any open OTP for email+purpose. TTL in seconds. */
export async function setOtpChallenge(
  email: string,
  purpose: string,
  record: Omit<OtpChallengeRecord, "attempts">,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedis()
  const payload: OtpChallengeRecord = { ...record, attempts: 0 }
  await redis.set(otpKey(purpose, email), JSON.stringify(payload), "EX", ttlSeconds)
}

export async function getOtpChallenge(
  email: string,
  purpose: string
): Promise<OtpChallengeRecord | null> {
  const raw = await getRedis().get(otpKey(purpose, email))
  if (!raw) return null
  try {
    return JSON.parse(raw) as OtpChallengeRecord
  } catch {
    return null
  }
}

export async function incrementOtpAttempts(
  email: string,
  purpose: string
): Promise<number> {
  const redis = getRedis()
  const key = otpKey(purpose, email)
  const raw = await redis.get(key)
  if (!raw) return 0

  let record: OtpChallengeRecord
  try {
    record = JSON.parse(raw) as OtpChallengeRecord
  } catch {
    return 0
  }

  record.attempts += 1
  const ttl = await redis.ttl(key)
  if (ttl > 0) {
    await redis.set(key, JSON.stringify(record), "EX", ttl)
  } else {
    await redis.set(key, JSON.stringify(record))
  }
  return record.attempts
}

export async function deleteOtpChallenge(
  email: string,
  purpose: string
): Promise<void> {
  await getRedis().del(otpKey(purpose, email))
}

/** Store refresh token hash with TTL; track under user for multi-device revoke. */
export async function storeRefreshToken(
  tokenHash: string,
  userId: string,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedis()
  const key = refreshKey(tokenHash)
  const userKey = refreshUserKey(userId)
  const record: RefreshRecord = { userId }

  const multi = redis.multi()
  multi.set(key, JSON.stringify(record), "EX", ttlSeconds)
  multi.sadd(userKey, tokenHash)
  multi.expire(userKey, ttlSeconds)
  await multi.exec()
}

export async function getRefreshToken(
  tokenHash: string
): Promise<RefreshRecord | null> {
  const raw = await getRedis().get(refreshKey(tokenHash))
  if (!raw) return null
  try {
    return JSON.parse(raw) as RefreshRecord
  } catch {
    return null
  }
}

/** Revoke one refresh token (logout / rotation). */
export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  const redis = getRedis()
  const record = await getRefreshToken(tokenHash)
  const multi = redis.multi()
  multi.del(refreshKey(tokenHash))
  if (record) {
    multi.srem(refreshUserKey(record.userId), tokenHash)
  }
  await multi.exec()
}

/** Revoke all refresh tokens for a user (account takeover / global logout). */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  const redis = getRedis()
  const userKey = refreshUserKey(userId)
  const hashes = await redis.smembers(userKey)
  if (hashes.length === 0) return

  const multi = redis.multi()
  for (const hash of hashes) {
    multi.del(refreshKey(hash))
  }
  multi.del(userKey)
  await multi.exec()
}

export async function pingRedis(): Promise<boolean> {
  try {
    const pong = await getRedis().ping()
    return pong === "PONG"
  } catch {
    return false
  }
}
