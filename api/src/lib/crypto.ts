import { createHash, randomInt, timingSafeEqual } from "node:crypto"

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex")
    const bufB = Buffer.from(b, "hex")
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export function generateOtpCode(stubCode: string | undefined): string {
  if (stubCode && /^\d{6}$/.test(stubCode)) {
    return stubCode
  }
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
