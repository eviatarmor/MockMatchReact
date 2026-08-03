import { describe, expect, it } from "vitest"
import {
  CREDIT_PACK_DEFINITIONS,
  getPackDefinition,
  getStripePriceId,
  listCreditPacks,
} from "@/modules/billing/packs.js"

describe("CREDIT_PACK_DEFINITIONS", () => {
  it("defines three ascending packs", () => {
    expect(CREDIT_PACK_DEFINITIONS.map((p) => p.id)).toEqual([
      "credits_100",
      "credits_500",
      "credits_1000",
    ])
    expect(CREDIT_PACK_DEFINITIONS.map((p) => p.credits)).toEqual([
      100, 500, 1000,
    ])
    // larger packs better unit price than smallest (4000/500 < 1000/100)
    const unit = (credits: number, cents: number) => cents / credits
    expect(
      unit(
        CREDIT_PACK_DEFINITIONS[1]!.credits,
        CREDIT_PACK_DEFINITIONS[1]!.amountCents
      )
    ).toBeLessThan(
      unit(
        CREDIT_PACK_DEFINITIONS[0]!.credits,
        CREDIT_PACK_DEFINITIONS[0]!.amountCents
      )
    )
  })
})

describe("getPackDefinition", () => {
  it("returns pack by id", () => {
    expect(getPackDefinition("credits_500")?.credits).toBe(500)
    expect(getPackDefinition("credits_1000")?.amountCents).toBe(7000)
  })
})

describe("listCreditPacks", () => {
  it("returns usd packs; unavailable without real Stripe price env", () => {
    const packs = listCreditPacks()
    expect(packs).toHaveLength(3)
    expect(packs.every((p) => p.currency === "usd")).toBe(true)
    // setup-env leaves Stripe unset → not available
    expect(packs.every((p) => p.available === false)).toBe(true)
  })
})

describe("getStripePriceId", () => {
  it("returns null when price env is empty/UNSET", () => {
    expect(getStripePriceId("credits_100")).toBeNull()
    expect(getStripePriceId("credits_500")).toBeNull()
  })
})
