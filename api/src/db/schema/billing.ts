import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import type { CreditBreakdown } from "@mockmatch/schemas"
import { users } from "./users.js"

export type CreditBreakdownJson = CreditBreakdown

export const DEFAULT_CREDIT_BREAKDOWN: CreditBreakdownJson = {
  mockInterviews: 0,
  resumeScans: 0,
  coverLetters: 0,
  jobFits: 0,
}

export const creditAccounts = pgTable("credit_accounts", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  total: integer("total").notNull().default(0),
  used: integer("used").notNull().default(0),
  breakdown: jsonb("breakdown")
    .$type<CreditBreakdownJson>()
    .notNull()
    .default(DEFAULT_CREDIT_BREAKDOWN),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const creditTopups = pgTable(
  "credit_topups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    packId: text("pack_id").notNull(),
    credits: integer("credits").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("credit_topups_session_uidx").on(table.stripeCheckoutSessionId),
  ]
)
