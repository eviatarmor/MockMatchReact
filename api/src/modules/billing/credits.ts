import { eq, sql } from "drizzle-orm"
import type { CreditBreakdown } from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import {
  creditAccounts,
  creditTopups,
  DEFAULT_CREDIT_BREAKDOWN,
} from "../../db/schema/billing.js"
import { ensureCreditAccount } from "../account/service.js"

export type CreditBalance = {
  total: number
  used: number
  remaining: number
  breakdown: CreditBreakdown
}

function normalizeBreakdown(raw: unknown): CreditBreakdown {
  const base: CreditBreakdown = { ...DEFAULT_CREDIT_BREAKDOWN }
  if (!raw || typeof raw !== "object") return base
  const obj = raw as Record<string, unknown>
  for (const key of Object.keys(base) as (keyof CreditBreakdown)[]) {
    const value = obj[key]
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      base[key] = Math.floor(value)
    }
  }
  return base
}

export async function getCreditBalance(
  db: Database,
  userId: string
): Promise<CreditBalance> {
  await ensureCreditAccount(db, userId)
  const row = await db.query.creditAccounts.findFirst({
    where: eq(creditAccounts.userId, userId),
  })
  const total = row?.total ?? 0
  const used = row?.used ?? 0
  return {
    total,
    used,
    remaining: Math.max(0, total - used),
    breakdown: normalizeBreakdown(row?.breakdown),
  }
}

/**
 * Collab hosting / share links require a paid account:
 * remaining credits > 0 OR any successful top-up history.
 */
export async function isPaidUser(
  db: Database,
  userId: string
): Promise<boolean> {
  const bal = await getCreditBalance(db, userId)
  if (bal.remaining > 0) return true
  const topup = await db.query.creditTopups.findFirst({
    where: eq(creditTopups.userId, userId),
    columns: { id: true },
  })
  return Boolean(topup)
}

/** Dev/local only — bump total credits so collab paid gate can be tested. */
export async function grantCredits(
  db: Database,
  userId: string,
  amount: number
): Promise<CreditBalance> {
  if (amount <= 0) return getCreditBalance(db, userId)
  await ensureCreditAccount(db, userId)
  await db
    .update(creditAccounts)
    .set({
      total: sql`${creditAccounts.total} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(creditAccounts.userId, userId))
  return getCreditBalance(db, userId)
}

export type SpendCreditsResult =
  | { ok: true; remaining: number; breakdown: CreditBreakdown }
  | { ok: false; remaining: number; reason: "insufficient" }

/**
 * Atomically spend credits into a breakdown bucket when balance allows.
 * Soft-fails on insufficient balance so callers can fall back to free paths.
 */
export async function spendCredits(
  db: Database,
  userId: string,
  amount: number,
  bucket: keyof CreditBreakdown
): Promise<SpendCreditsResult> {
  if (amount <= 0) {
    const bal = await getCreditBalance(db, userId)
    return { ok: true, remaining: bal.remaining, breakdown: bal.breakdown }
  }

  await ensureCreditAccount(db, userId)

  const [row] = await db
    .update(creditAccounts)
    .set({
      used: sql`${creditAccounts.used} + ${amount}`,
      breakdown: sql`jsonb_set(
        COALESCE(${creditAccounts.breakdown}, '{}'::jsonb),
        ARRAY[${bucket}]::text[],
        to_jsonb(COALESCE((${creditAccounts.breakdown}->>${bucket})::int, 0) + ${amount}),
        true
      )`,
      updatedAt: new Date(),
    })
    .where(
      sql`${creditAccounts.userId} = ${userId}::uuid AND (${creditAccounts.total} - ${creditAccounts.used}) >= ${amount}`
    )
    .returning({
      total: creditAccounts.total,
      used: creditAccounts.used,
      breakdown: creditAccounts.breakdown,
    })

  if (!row) {
    const bal = await getCreditBalance(db, userId)
    return { ok: false, remaining: bal.remaining, reason: "insufficient" }
  }

  return {
    ok: true,
    remaining: Math.max(0, row.total - row.used),
    breakdown: normalizeBreakdown(row.breakdown),
  }
}
