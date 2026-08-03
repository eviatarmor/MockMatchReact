import { describe, expect, it } from "vitest"
import {
  billingDetailsSchema,
  billingSummarySchema,
  checkoutUrlSchema,
  createTopUpCheckoutInputSchema,
  creditBreakdownSchema,
  creditPackIdSchema,
  creditPackSchema,
} from "@/billing/api.js"

describe("creditPackIdSchema", () => {
  it("parses known packs only", () => {
    expect(creditPackIdSchema.parse("credits_100")).toBe("credits_100")
    expect(() => creditPackIdSchema.parse("credits_999")).toThrow()
  })
})

describe("creditBreakdownSchema", () => {
  it("defaults jobFits to 0 and rejects negatives", () => {
    const b = creditBreakdownSchema.parse({
      mockInterviews: 1,
      resumeScans: 2,
      coverLetters: 3,
    })
    expect(b.jobFits).toBe(0)
    expect(() =>
      creditBreakdownSchema.parse({
        mockInterviews: -1,
        resumeScans: 0,
        coverLetters: 0,
        jobFits: 0,
      })
    ).toThrow()
  })
})

describe("billing details + summary", () => {
  it("billingDetailsSchema needs valid email", () => {
    expect(
      billingDetailsSchema.parse({
        name: null,
        email: "a@b.co",
        addressLine: null,
        city: null,
        country: null,
      }).email
    ).toBe("a@b.co")
    expect(() =>
      billingDetailsSchema.parse({
        name: null,
        email: "nope",
        addressLine: null,
        city: null,
        country: null,
      })
    ).toThrow()
  })

  it("billingSummarySchema plan is free only for now", () => {
    const s = billingSummarySchema.parse({
      plan: "free",
      credits: {
        total: 10,
        used: 0,
        breakdown: {
          mockInterviews: 0,
          resumeScans: 0,
          coverLetters: 0,
          jobFits: 0,
        },
      },
      card: {
        brand: null,
        last4: null,
        expMonth: null,
        expYear: null,
        holder: null,
      },
      details: {
        name: null,
        email: "u@example.com",
        addressLine: null,
        city: null,
        country: null,
      },
      stripeConfigured: false,
      hasCustomer: false,
    })
    expect(s.plan).toBe("free")
    expect(() =>
      billingSummarySchema.parse({ ...s, plan: "pro" })
    ).toThrow()
  })
})

describe("top-up + packs", () => {
  it("createTopUpCheckoutInputSchema + pack bounds", () => {
    expect(
      createTopUpCheckoutInputSchema.parse({ packId: "credits_500" }).packId
    ).toBe("credits_500")
    expect(
      creditPackSchema.parse({
        id: "credits_100",
        credits: 100,
        amountCents: 999,
        currency: "usd",
        available: true,
      }).amountCents
    ).toBe(999)
    expect(() =>
      creditPackSchema.parse({
        id: "credits_100",
        credits: 0,
        amountCents: 1,
        currency: "usd",
        available: true,
      })
    ).toThrow()
  })

  it("checkoutUrlSchema needs url", () => {
    expect(
      checkoutUrlSchema.parse({ url: "https://checkout.stripe.com/x" }).url
    ).toContain("stripe")
    expect(() => checkoutUrlSchema.parse({ url: "nope" })).toThrow()
  })
})
