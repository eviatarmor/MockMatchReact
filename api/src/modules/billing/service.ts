import { eq, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type {
  BillingSummary,
  CreateTopUpCheckoutInput,
  CreditPack,
  InvoiceDto,
} from "@mockmatch/schemas"
import { env } from "../../config/env.js"
import type { Database } from "../../db/client.js"
import {
  creditAccounts,
  creditTopups,
  DEFAULT_CREDIT_BREAKDOWN,
} from "../../db/schema/billing.js"
import { users } from "../../db/schema/users.js"
import { logger } from "../../lib/logger.js"
import { getStripe, isStripeConfigured } from "../../lib/stripe.js"
import { ensureCreditAccount } from "../account/service.js"
import {
  getPackDefinition,
  getStripePriceId,
  listCreditPacks,
} from "./packs.js"

function requireStripe(): void {
  if (!isStripeConfigured()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Billing is not configured. Set STRIPE_SECRET_KEY to enable top-ups.",
    })
  }
}

async function getUserOrThrow(db: Database, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." })
  }
  return user
}

/** Create Stripe Customer once; store id on users. Stateless across replicas. */
export async function ensureStripeCustomer(
  db: Database,
  userId: string
): Promise<string> {
  requireStripe()
  const user = await getUserOrThrow(db, userId)

  if (user.stripeCustomerId) return user.stripeCustomerId

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.fullName ?? undefined,
    metadata: { userId: user.id },
  })

  await db
    .update(users)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  return customer.id
}

export async function getBillingSummary(
  db: Database,
  userId: string
): Promise<BillingSummary> {
  const user = await getUserOrThrow(db, userId)
  await ensureCreditAccount(db, userId)

  const credits = await db.query.creditAccounts.findFirst({
    where: eq(creditAccounts.userId, userId),
  })

  const breakdown = {
    ...DEFAULT_CREDIT_BREAKDOWN,
    ...(credits?.breakdown ?? {}),
    jobFits: credits?.breakdown?.jobFits ?? 0,
  }

  return {
    plan: "free",
    credits: {
      total: credits?.total ?? 0,
      used: credits?.used ?? 0,
      breakdown,
    },
    card: {
      brand: user.cardBrand,
      last4: user.cardLast4,
      expMonth: user.cardExpMonth,
      expYear: user.cardExpYear,
      holder: user.fullName,
    },
    details: {
      name: user.fullName,
      email: user.email,
      addressLine: null,
      city: null,
      country: null,
    },
    stripeConfigured: isStripeConfigured(),
    hasCustomer: Boolean(user.stripeCustomerId),
  }
}

export function getPacks(): CreditPack[] {
  return listCreditPacks()
}

export async function createTopUpCheckout(
  db: Database,
  userId: string,
  input: CreateTopUpCheckoutInput
): Promise<{ url: string }> {
  requireStripe()

  const pack = getPackDefinition(input.packId)
  const priceId = getStripePriceId(input.packId)
  if (!pack || !priceId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This credit pack is not available.",
    })
  }

  const customerId = await ensureStripeCustomer(db, userId)

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.APP_URL}/billing?topup=success`,
    cancel_url: `${env.APP_URL}/billing?topup=cancel`,
    // Save card for portal updates later — still no PAN on our servers.
    payment_intent_data: {
      setup_future_usage: "off_session",
    },
    metadata: {
      userId,
      packId: pack.id,
      credits: String(pack.credits),
    },
  })

  if (!session.url) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe Checkout did not return a URL.",
    })
  }

  return { url: session.url }
}

export async function createPortalSession(
  db: Database,
  userId: string
): Promise<{ url: string }> {
  requireStripe()
  const customerId = await ensureStripeCustomer(db, userId)

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.APP_URL}/billing`,
  })

  return { url: session.url }
}

function formatAmount(amountCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100)
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`
  }
}

function mapInvoiceStatus(
  status: string | null
): InvoiceDto["status"] {
  if (
    status === "paid" ||
    status === "open" ||
    status === "void" ||
    status === "uncollectible" ||
    status === "draft"
  ) {
    return status
  }
  return "pending"
}

export async function listInvoices(
  db: Database,
  userId: string
): Promise<InvoiceDto[]> {
  const user = await getUserOrThrow(db, userId)
  if (!user.stripeCustomerId || !isStripeConfigured()) {
    return []
  }

  const invoices = await getStripe().invoices.list({
    customer: user.stripeCustomerId,
    limit: 24,
  })

  // One-time Checkout often surfaces as PaymentIntents; merge recent charges if no invoices.
  const fromInvoices: InvoiceDto[] = invoices.data.map((invoice) => ({
    id: invoice.number ?? invoice.id,
    date: new Date((invoice.created ?? 0) * 1000).toISOString(),
    amount: formatAmount(invoice.amount_paid ?? invoice.total ?? 0, invoice.currency ?? "usd"),
    status: mapInvoiceStatus(invoice.status),
    receiptUrl: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null,
  }))

  if (fromInvoices.length > 0) return fromInvoices

  const intents = await getStripe().paymentIntents.list({
    customer: user.stripeCustomerId,
    limit: 24,
  })

  return intents.data
    .filter((pi) => pi.status === "succeeded")
    .map((pi) => ({
      id: pi.id,
      date: new Date(pi.created * 1000).toISOString(),
      amount: formatAmount(pi.amount_received || pi.amount, pi.currency),
      status: "paid" as const,
      receiptUrl: null,
    }))
}

/** Webhook: grant credits once per Checkout session. */
export async function grantCreditsFromCheckoutSession(
  db: Database,
  session: {
    id: string
    payment_intent?: string | { id: string } | null
    amount_total?: number | null
    currency?: string | null
    metadata?: Record<string, string> | null
    payment_status?: string | null
  }
): Promise<void> {
  if (session.payment_status && session.payment_status !== "paid") {
    logger.info({ sessionId: session.id }, "checkout not paid — skip credit grant")
    return
  }

  const userId = session.metadata?.userId
  const packId = session.metadata?.packId
  const creditsRaw = session.metadata?.credits
  const credits = creditsRaw ? Number.parseInt(creditsRaw, 10) : NaN

  if (!userId || !packId || !Number.isFinite(credits) || credits <= 0) {
    logger.warn(
      { sessionId: session.id, metadata: session.metadata },
      "checkout session missing credit metadata"
    )
    return
  }

  const existing = await db.query.creditTopups.findFirst({
    where: eq(creditTopups.stripeCheckoutSessionId, session.id),
  })
  if (existing) {
    logger.info({ sessionId: session.id }, "top-up already applied")
    return
  }

  await ensureCreditAccount(db, userId)

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  await db.transaction(async (tx) => {
    await tx.insert(creditTopups).values({
      userId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      packId,
      credits,
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
    })

    await tx
      .update(creditAccounts)
      .set({
        total: sql`${creditAccounts.total} + ${credits}`,
        updatedAt: new Date(),
      })
      .where(eq(creditAccounts.userId, userId))
  })

  logger.info(
    { userId, sessionId: session.id, credits, packId },
    "credits granted from checkout"
  )
}

/** Sync display-only card fields from Stripe default payment method. */
export async function syncCardDisplayFromCustomer(
  db: Database,
  stripeCustomerId: string
): Promise<void> {
  if (!isStripeConfigured()) return

  const customer = await getStripe().customers.retrieve(stripeCustomerId, {
    expand: ["invoice_settings.default_payment_method"],
  })

  if (customer.deleted) {
    await db
      .update(users)
      .set({
        cardBrand: null,
        cardLast4: null,
        cardExpMonth: null,
        cardExpYear: null,
        updatedAt: new Date(),
      })
      .where(eq(users.stripeCustomerId, stripeCustomerId))
    return
  }

  let brand: string | null = null
  let last4: string | null = null
  let expMonth: number | null = null
  let expYear: number | null = null

  const defaultPm = customer.invoice_settings?.default_payment_method
  const pmId =
    typeof defaultPm === "string"
      ? defaultPm
      : defaultPm && typeof defaultPm === "object" && "id" in defaultPm
        ? defaultPm.id
        : null

  if (defaultPm && typeof defaultPm === "object" && "card" in defaultPm) {
    const card = defaultPm.card
    if (card) {
      brand = card.brand ?? null
      last4 = card.last4 ?? null
      expMonth = card.exp_month ?? null
      expYear = card.exp_year ?? null
    }
  } else if (pmId) {
    const pm = await getStripe().paymentMethods.retrieve(pmId)
    if (pm.card) {
      brand = pm.card.brand
      last4 = pm.card.last4
      expMonth = pm.card.exp_month
      expYear = pm.card.exp_year
    }
  } else {
    // Fall back to most recent card on customer
    const methods = await getStripe().paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
      limit: 1,
    })
    const card = methods.data[0]?.card
    if (card) {
      brand = card.brand
      last4 = card.last4
      expMonth = card.exp_month
      expYear = card.exp_year
    }
  }

  await db
    .update(users)
    .set({
      cardBrand: brand,
      cardLast4: last4,
      cardExpMonth: expMonth,
      cardExpYear: expYear,
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, stripeCustomerId))
}
