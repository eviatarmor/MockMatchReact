import { describe, expect, it } from "vitest"
import {
  billingDetailsSchema,
  billingSummarySchema,
  checkoutUrlSchema,
  createTopUpCheckoutInputSchema,
  creditBreakdownSchema,
  creditPackIdSchema,
  creditPackSchema,
  creditUsageSchema,
  invoiceDtoSchema,
  invoiceStatusSchema,
  paymentCardDisplaySchema,
} from "@/billing/api.js"

describe("creditPackIdSchema", () => {
  it("parses known packs only", () => {
    expect(creditPackIdSchema.parse("credits_100")).toBe("credits_100")
    expect(creditPackIdSchema.parse("credits_500")).toBe("credits_500")
    expect(creditPackIdSchema.parse("credits_1000")).toBe("credits_1000")
    expect(() => creditPackIdSchema.parse("credits_999")).toThrow()
  })
})

describe("creditBreakdownSchema / creditUsageSchema", () => {
  it("defaults jobFits to 0", () => {
    const b = creditBreakdownSchema.parse({
      mockInterviews: 1,
      resumeScans: 2,
      coverLetters: 3,
    })
    expect(b.jobFits).toBe(0)
  })

  it("rejects negative", () => {
    expect(() =>
      creditBreakdownSchema.parse({
        mockInterviews: -1,
        resumeScans: 0,
        coverLetters: 0,
        jobFits: 0,
      })
    ).toThrow()
  })

  it("usage wraps breakdown", () => {
    const u = creditUsageSchema.parse({
      total: 100,
      used: 10,
      breakdown: {
        mockInterviews: 5,
        resumeScans: 3,
        coverLetters: 2,
        jobFits: 0,
      },
    })
    expect(u.total).toBe(100)
  })
})

describe("payment + billing details", () => {
  it("card display allows nulls", () => {
    const c = paymentCardDisplaySchema.parse({
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2030,
      holder: "Ada",
    })
    expect(c.last4).toBe("4242")
    expect(() =>
      paymentCardDisplaySchema.parse({
        brand: null,
        last4: null,
        expMonth: 13,
        expYear: null,
        holder: null,
      })
    ).toThrow()
  })

  it("billingDetailsSchema needs email", () => {
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
})

describe("billingSummarySchema", () => {
  it("plan is free only for now", () => {
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
  it("createTopUpCheckoutInputSchema", () => {
    expect(
      createTopUpCheckoutInputSchema.parse({ packId: "credits_500" }).packId
    ).toBe("credits_500")
  })

  it("creditPackSchema", () => {
    const p = creditPackSchema.parse({
      id: "credits_100",
      credits: 100,
      amountCents: 999,
      currency: "usd",
      available: true,
    })
    expect(p.amountCents).toBe(999)
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

describe("invoice schemas", () => {
  it("status enum + dto", () => {
    expect(invoiceStatusSchema.parse("paid")).toBe("paid")
    expect(invoiceStatusSchema.parse("pending")).toBe("pending")
    const inv = invoiceDtoSchema.parse({
      id: "in_1",
      date: "2026-01-01",
      amount: "$9.99",
      status: "paid",
      receiptUrl: null,
    })
    expect(inv.receiptUrl).toBeNull()
  })
})
