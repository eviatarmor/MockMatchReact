import Stripe from "stripe"
import { env } from "../config/env.js"

let stripeClient: Stripe | null = null

function stripeSecret(): string {
  const key = env.STRIPE_SECRET_KEY.trim()
  // Terraform placeholders use "UNSET" until real secrets are added.
  if (!key || key === "UNSET") return ""
  return key
}

/** True when a secret key is configured (Checkout / Portal / webhooks usable). */
export function isStripeConfigured(): boolean {
  return stripeSecret().length > 0
}

/**
 * Lazy Stripe SDK. Throws if key missing — callers must check isStripeConfigured first
 * for user-facing paths, or catch for best-effort cleanup (e.g. account delete).
 */
export function getStripe(): Stripe {
  const key = stripeSecret()
  if (!key) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY empty)")
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    })
  }
  return stripeClient
}
