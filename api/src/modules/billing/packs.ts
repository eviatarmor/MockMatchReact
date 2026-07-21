import type { CreditPack, CreditPackId } from "@mockmatch/schemas"
import { env } from "../../config/env.js"

interface PackDefinition {
  readonly id: CreditPackId
  readonly credits: number
  readonly amountCents: number
  readonly priceEnvKey:
    | "STRIPE_PRICE_CREDITS_100"
    | "STRIPE_PRICE_CREDITS_500"
    | "STRIPE_PRICE_CREDITS_1000"
}

/** Catalog for Vapi-style top-ups. Price IDs come from env (Stripe Dashboard). */
export const CREDIT_PACK_DEFINITIONS: readonly PackDefinition[] = [
  {
    id: "credits_100",
    credits: 100,
    amountCents: 1000,
    priceEnvKey: "STRIPE_PRICE_CREDITS_100",
  },
  {
    id: "credits_500",
    credits: 500,
    amountCents: 4000,
    priceEnvKey: "STRIPE_PRICE_CREDITS_500",
  },
  {
    id: "credits_1000",
    credits: 1000,
    amountCents: 7000,
    priceEnvKey: "STRIPE_PRICE_CREDITS_1000",
  },
] as const

export function getPackDefinition(
  packId: CreditPackId
): PackDefinition | undefined {
  return CREDIT_PACK_DEFINITIONS.find((pack) => pack.id === packId)
}

function isRealPriceId(priceId: string): boolean {
  return priceId.length > 0 && priceId !== "UNSET"
}

export function listCreditPacks(): CreditPack[] {
  return CREDIT_PACK_DEFINITIONS.map((pack) => {
    const priceId = env[pack.priceEnvKey]
    return {
      id: pack.id,
      credits: pack.credits,
      amountCents: pack.amountCents,
      currency: "usd",
      available: isRealPriceId(priceId) && env.STRIPE_SECRET_KEY.length > 0 && env.STRIPE_SECRET_KEY !== "UNSET",
    }
  })
}

export function getStripePriceId(packId: CreditPackId): string | null {
  const def = getPackDefinition(packId)
  if (!def) return null
  const priceId = env[def.priceEnvKey]
  return isRealPriceId(priceId) ? priceId : null
}
