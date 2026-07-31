import { createHmac, timingSafeEqual } from "node:crypto"
import { env } from "../../config/env.js"

/**
 * Browser-loadable avatar URLs go through the API (not direct S3 signed URLs).
 * S3 presigned GETs work from Node but are brittle in the browser with local S3Proxy
 * (private-network / host quirks). Same-origin-friendly API URLs are stable and cacheable.
 */

function hmac(payload: string): string {
  return createHmac("sha256", env.JWT_ACCESS_SECRET).update(payload).digest("hex")
}

function payload(userId: string, versionMs: number): string {
  return `avatar:${userId}:${versionMs}`
}

export function signAvatarQuery(userId: string, versionMs: number): string {
  return hmac(payload(userId, versionMs))
}

export function verifyAvatarQuery(
  userId: string,
  versionMs: number,
  sig: string
): boolean {
  if (!userId || !Number.isFinite(versionMs) || !sig) return false
  // Reject absurdly old links (30d).
  const ageMs = Date.now() - versionMs
  if (ageMs < -60_000 || ageMs > 30 * 24 * 60 * 60 * 1000) return false

  const expected = signAvatarQuery(userId, versionMs)
  try {
    const a = Buffer.from(expected, "utf8")
    const b = Buffer.from(sig, "utf8")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Public avatar image URL for <img src>. Null when no photo. */
export function buildAvatarPublicUrl(
  userId: string,
  avatarKey: string | null | undefined,
  updatedAt: Date | string | null | undefined
): string | null {
  if (!avatarKey?.trim()) return null
  const versionMs =
    updatedAt instanceof Date
      ? updatedAt.getTime()
      : updatedAt
        ? new Date(updatedAt).getTime()
        : Date.now()
  if (!Number.isFinite(versionMs)) return null

  const sig = signAvatarQuery(userId, versionMs)
  const base = env.API_URL.replace(/\/$/, "")
  return `${base}/account/avatar/${userId}?v=${versionMs}&sig=${sig}`
}
