import { z } from "zod"

export const creditPackIdSchema = z.enum([
  "credits_100",
  "credits_500",
  "credits_1000",
])

export const creditBreakdownSchema = z.object({
  mockInterviews: z.number().int().nonnegative(),
  resumeScans: z.number().int().nonnegative(),
  coverLetters: z.number().int().nonnegative(),
  /** AI job-fit scores on Discover (paid only). */
  jobFits: z.number().int().nonnegative().default(0),
})

export const creditUsageSchema = z.object({
  total: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  breakdown: creditBreakdownSchema,
})

export const paymentCardDisplaySchema = z.object({
  brand: z.string().nullable(),
  last4: z.string().nullable(),
  expMonth: z.number().int().min(1).max(12).nullable(),
  expYear: z.number().int().nullable(),
  holder: z.string().nullable(),
})

export const billingDetailsSchema = z.object({
  name: z.string().nullable(),
  email: z.string().email(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
})

export const billingSummarySchema = z.object({
  plan: z.literal("free"),
  credits: creditUsageSchema,
  card: paymentCardDisplaySchema,
  details: billingDetailsSchema,
  stripeConfigured: z.boolean(),
  hasCustomer: z.boolean(),
})

export const creditPackSchema = z.object({
  id: creditPackIdSchema,
  credits: z.number().int().positive(),
  amountCents: z.number().int().positive(),
  currency: z.string(),
  available: z.boolean(),
})

export const createTopUpCheckoutInputSchema = z.object({
  packId: creditPackIdSchema,
})

export const checkoutUrlSchema = z.object({
  url: z.string().url(),
})

export const invoiceStatusSchema = z.enum([
  "paid",
  "open",
  "void",
  "uncollectible",
  "draft",
  "pending",
])

export const invoiceDtoSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.string(),
  status: invoiceStatusSchema,
  receiptUrl: z.string().url().nullable(),
})

export type CreditPackId = z.infer<typeof creditPackIdSchema>
export type CreditBreakdown = z.infer<typeof creditBreakdownSchema>
export type CreditUsage = z.infer<typeof creditUsageSchema>
export type PaymentCardDisplay = z.infer<typeof paymentCardDisplaySchema>
export type BillingDetails = z.infer<typeof billingDetailsSchema>
export type BillingSummary = z.infer<typeof billingSummarySchema>
export type CreditPack = z.infer<typeof creditPackSchema>
export type CreateTopUpCheckoutInput = z.infer<
  typeof createTopUpCheckoutInputSchema
>
export type InvoiceDto = z.infer<typeof invoiceDtoSchema>
