import { eq } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import {
  DEFAULT_USER_PREFERENCES,
  userPreferencesSchema,
  type AccountDto,
  type UpdatePreferencesInput,
  type UpdateProfileInput,
  type UserPreferences,
} from "@mockmatch/schemas"
import { env } from "../../config/env.js"
import type { Database } from "../../db/client.js"
import {
  creditAccounts,
  DEFAULT_CREDIT_BREAKDOWN,
} from "../../db/schema/billing.js"
import { users } from "../../db/schema/users.js"
import { revokeAllRefreshTokens } from "../../lib/auth-store.js"
import { logger } from "../../lib/logger.js"
import { getStripe, isStripeConfigured } from "../../lib/stripe.js"

function parsePreferences(raw: unknown): UserPreferences {
  const parsed = userPreferencesSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  return { ...DEFAULT_USER_PREFERENCES, privacy: { ...DEFAULT_USER_PREFERENCES.privacy } }
}

function toAccountDto(row: {
  id: string
  email: string
  fullName: string | null
  preferences: unknown
}): AccountDto {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    preferences: parsePreferences(row.preferences),
  }
}

/** Ensure credit row exists (free grant once). Idempotent. */
export async function ensureCreditAccount(
  db: Database,
  userId: string
): Promise<void> {
  const existing = await db.query.creditAccounts.findFirst({
    where: eq(creditAccounts.userId, userId),
  })
  if (existing) return

  await db.insert(creditAccounts).values({
    userId,
    total: env.FREE_CREDIT_GRANT,
    used: 0,
    breakdown: DEFAULT_CREDIT_BREAKDOWN,
  })
}

export async function getAccount(
  db: Database,
  userId: string
): Promise<AccountDto> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." })
  }

  await ensureCreditAccount(db, userId)
  return toAccountDto(user)
}

export async function updateProfile(
  db: Database,
  userId: string,
  input: UpdateProfileInput
): Promise<AccountDto> {
  const [updated] = await db
    .update(users)
    .set({
      fullName: input.fullName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  if (!updated) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." })
  }

  return toAccountDto(updated)
}

export async function updatePreferences(
  db: Database,
  userId: string,
  input: UpdatePreferencesInput
): Promise<AccountDto> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." })
  }

  const current = parsePreferences(user.preferences)
  const next: UserPreferences = {
    voiceProfile: input.voiceProfile ?? current.voiceProfile,
    country: input.country ?? current.country,
    dateFormat: input.dateFormat ?? current.dateFormat,
    timeFormat: input.timeFormat ?? current.timeFormat,
    privacy: {
      ...current.privacy,
      ...input.privacy,
    },
  }

  const validated = userPreferencesSchema.parse(next)

  const [updated] = await db
    .update(users)
    .set({
      preferences: validated,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  if (!updated) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." })
  }

  return toAccountDto(updated)
}

/** Best-effort Stripe customer delete — never blocks account wipe. */
async function deleteStripeCustomerBestEffort(
  stripeCustomerId: string | null
): Promise<void> {
  if (!stripeCustomerId || !isStripeConfigured()) return
  try {
    await getStripe().customers.del(stripeCustomerId)
  } catch (error) {
    logger.warn(
      { err: error, stripeCustomerId },
      "failed to delete Stripe customer on account delete"
    )
  }
}

export async function deleteAccount(
  db: Database,
  userId: string
): Promise<{ ok: true }> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." })
  }

  await deleteStripeCustomerBestEffort(user.stripeCustomerId)
  await revokeAllRefreshTokens(userId)

  await db.delete(users).where(eq(users.id, userId))

  logger.info({ userId }, "account deleted")
  return { ok: true }
}

export async function requestDataExport(
  _db: Database,
  userId: string
): Promise<{ ok: true }> {
  // Scaffold: real ZIP + email lands when object storage + worker pipeline exist.
  logger.info({ userId }, "data export requested (scaffold)")
  return { ok: true }
}

export async function clearInterviewHistory(
  _db: Database,
  userId: string
): Promise<{ ok: true }> {
  // No-op until mock-interview tables exist.
  logger.info({ userId }, "clear interview history (no-op scaffold)")
  return { ok: true }
}
