import { and, desc, eq, gt, isNull } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type { RequestOtpInput, VerifyOtpInput } from "@mockmatch/schemas"
import { env } from "../../config/env.js"
import type { Database } from "../../db/client.js"
import { otpChallenges, refreshTokens } from "../../db/schema/auth.js"
import { users } from "../../db/schema/users.js"
import type { EventBus } from "../../events/bus.js"
import { generateOtpCode, hashToken, normalizeEmail, safeEqualHex } from "../../lib/crypto.js"
import { sendOtpEmail } from "../../lib/email.js"
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js"
import { logger } from "../../lib/logger.js"

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    fullName: string | null
  }
}

export async function requestOtp(
  db: Database,
  bus: EventBus,
  input: RequestOtpInput
): Promise<{ ok: true }> {
  const email = normalizeEmail(input.email)
  const purpose = input.purpose

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (purpose === "login") {
    // Anti-enumeration: always report success so callers cannot probe which emails exist.
    // Only issue a real OTP when an account is present.
    if (!existing) {
      logger.info({ email, purpose }, "otp request for unknown email (suppressed)")
      return { ok: true }
    }
  } else if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An account with this email already exists. Log in instead.",
    })
  }

  const code = generateOtpCode(env.OTP_STUB_CODE || undefined)
  const codeHash = hashToken(code)
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000)

  // Invalidate prior open challenges for this email+purpose
  await db
    .update(otpChallenges)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(otpChallenges.email, email),
        eq(otpChallenges.purpose, purpose),
        isNull(otpChallenges.consumedAt)
      )
    )

  await db.insert(otpChallenges).values({
    email,
    purpose,
    fullName: purpose === "signup" ? input.fullName.trim() : null,
    codeHash,
    expiresAt,
  })

  await sendOtpEmail({ to: email, code, purpose })

  await bus.publish({
    type: "auth.otp_requested",
    payload: { email },
  })

  if (env.OTP_STUB_CODE) {
    logger.info({ email, purpose, stubCode: code }, "otp issued (stub code mode)")
  } else {
    logger.info({ email, purpose }, "otp issued")
  }

  return { ok: true }
}

export async function verifyOtp(
  db: Database,
  bus: EventBus,
  input: VerifyOtpInput
): Promise<AuthTokens> {
  const email = normalizeEmail(input.email)
  const purpose = input.purpose

  const challenge = await db.query.otpChallenges.findFirst({
    where: and(
      eq(otpChallenges.email, email),
      eq(otpChallenges.purpose, purpose),
      isNull(otpChallenges.consumedAt),
      gt(otpChallenges.expiresAt, new Date())
    ),
    orderBy: [desc(otpChallenges.createdAt)],
  })

  if (!challenge) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Code expired or not found. Request a new one.",
    })
  }

  if (challenge.attempts >= env.OTP_MAX_ATTEMPTS) {
    await db
      .update(otpChallenges)
      .set({ consumedAt: new Date() })
      .where(eq(otpChallenges.id, challenge.id))
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts. Request a new code.",
    })
  }

  const inputHash = hashToken(input.code)
  const valid = safeEqualHex(inputHash, challenge.codeHash)

  if (!valid) {
    await db
      .update(otpChallenges)
      .set({ attempts: challenge.attempts + 1 })
      .where(eq(otpChallenges.id, challenge.id))
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid verification code.",
    })
  }

  await db
    .update(otpChallenges)
    .set({ consumedAt: new Date() })
    .where(eq(otpChallenges.id, challenge.id))

  let user =
    (await db.query.users.findFirst({
      where: eq(users.email, email),
    })) ?? null

  if (purpose === "signup") {
    if (user) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "An account with this email already exists. Log in instead.",
      })
    }
    const [created] = await db
      .insert(users)
      .values({
        email,
        fullName: challenge.fullName ?? "User",
      })
      .returning()
    user = created
  } else if (!user) {
    // Anti-enumeration: do not reveal whether the email is registered
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid verification code.",
    })
  }

  const tokens = await issueTokens(db, {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  })

  await bus.publish({
    type: "auth.user_signed_in",
    payload: { userId: user.id },
  })

  return tokens
}

async function issueTokens(
  db: Database,
  user: { id: string; email: string; fullName: string | null }
): Promise<AuthTokens> {
  const accessToken = await signAccessToken({
    userId: user.id,
    email: user.email,
  })
  const refreshToken = await signRefreshToken({ userId: user.id })

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
  }
}

export async function refreshSession(
  db: Database,
  refreshToken: string
): Promise<AuthTokens> {
  let payload
  try {
    payload = await verifyRefreshToken(refreshToken)
  } catch {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid refresh token.",
    })
  }

  const tokenHash = hashToken(refreshToken)
  const stored = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.tokenHash, tokenHash),
      eq(refreshTokens.userId, payload.sub),
      isNull(refreshTokens.revokedAt),
      gt(refreshTokens.expiresAt, new Date())
    ),
  })

  if (!stored) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Refresh token revoked or expired.",
    })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
  })
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found.",
    })
  }

  // Rotate refresh token
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, stored.id))

  return issueTokens(db, {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  })
}

export async function logout(
  db: Database,
  refreshToken: string | undefined
): Promise<{ ok: true }> {
  if (!refreshToken) return { ok: true }

  try {
    await verifyRefreshToken(refreshToken)
  } catch {
    return { ok: true }
  }

  const tokenHash = hashToken(refreshToken)
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))

  return { ok: true }
}
