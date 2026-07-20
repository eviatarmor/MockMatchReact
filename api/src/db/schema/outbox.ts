import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core"

/**
 * Transactional outbox — write domain events in the same DB transaction
 * as business rows, then relay to EventBus (BullMQ locally / SQS later).
 */
export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
}, (table) => [
  index("outbox_events_unprocessed_idx").on(table.processedAt, table.createdAt),
])
