import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import type { UserPreferences } from "@mockmatch/schemas"
import { DEFAULT_USER_PREFERENCES } from "@mockmatch/schemas"

export type UserPreferencesJson = UserPreferences

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name"),
    preferences: jsonb("preferences")
      .$type<UserPreferencesJson>()
      .notNull()
      .$defaultFn(() => ({
        ...DEFAULT_USER_PREFERENCES,
        privacy: { ...DEFAULT_USER_PREFERENCES.privacy },
      })),
    stripeCustomerId: text("stripe_customer_id"),
    cardBrand: text("card_brand"),
    cardLast4: text("card_last4"),
    cardExpMonth: integer("card_exp_month"),
    cardExpYear: integer("card_exp_year"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_uidx").on(table.email),
    uniqueIndex("users_stripe_customer_uidx").on(table.stripeCustomerId),
  ]
)

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("oauth_provider_user_uidx").on(
      table.provider,
      table.providerUserId
    ),
  ]
)
