import { Hono } from "hono"
import type Stripe from "stripe"
import { env } from "../../config/env.js"
import { db } from "../../db/client.js"
import { logger } from "../../lib/logger.js"
import { getStripe, isStripeConfigured } from "../../lib/stripe.js"
import {
  grantCreditsFromCheckoutSession,
  syncCardDisplayFromCustomer,
} from "./service.js"

/**
 * Raw Stripe webhooks — must stay outside tRPC so body is unparsed for signature check.
 * PCI: only metadata + Stripe IDs; never accept card PANs here.
 */
export const billingWebhookRoutes = new Hono()

billingWebhookRoutes.post("/webhook", async (c) => {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET.trim()
  if (!isStripeConfigured() || !webhookSecret || webhookSecret === "UNSET") {
    logger.warn("Stripe webhook hit but Stripe/webhook secret not configured")
    return c.json({ error: "Webhook not configured" }, 503)
  }

  const signature = c.req.header("stripe-signature")
  if (!signature) {
    return c.json({ error: "Missing stripe-signature" }, 400)
  }

  const rawBody = await c.req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    )
  } catch (error) {
    logger.warn({ err: error }, "Stripe webhook signature verification failed")
    return c.json({ error: "Invalid signature" }, 400)
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await grantCreditsFromCheckoutSession(db, session)
        if (typeof session.customer === "string") {
          await syncCardDisplayFromCustomer(db, session.customer)
        } else if (session.customer && "id" in session.customer) {
          await syncCardDisplayFromCustomer(db, session.customer.id)
        }
        break
      }
      case "customer.updated":
      case "payment_method.attached":
      case "payment_method.detached": {
        const obj = event.data.object as { id?: string; customer?: string | null }
        const customerId =
          event.type === "customer.updated"
            ? obj.id
            : typeof obj.customer === "string"
              ? obj.customer
              : null
        if (customerId) {
          await syncCardDisplayFromCustomer(db, customerId)
        }
        break
      }
      default:
        logger.debug({ type: event.type }, "unhandled Stripe event")
    }
  } catch (error) {
    logger.error({ err: error, type: event.type }, "Stripe webhook handler failed")
    return c.json({ error: "Handler failed" }, 500)
  }

  return c.json({ received: true })
})
