import {
  index,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { users } from "./users.js"

export const trackingStatusEnum = pgEnum("tracking_status", [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "declined",
])

/**
 * User job applications / tracking board (Discover → Applications).
 * `sourceKey` is the client-facing key (e.g. `adzuna:123`, `import-…`) for Discover isTracked.
 */
export const trackedJobs = pgTable(
  "tracked_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Stable key from Discover/import for matching (`adzuna:…`, `import-…`). */
    sourceKey: text("source_key").notNull(),
    provider: text("provider").notNull().default("manual"),
    externalId: text("external_id"),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location").notNull().default("—"),
    description: text("description"),
    applyUrl: text("apply_url"),
    status: trackingStatusEnum("status").notNull().default("saved"),
    salaryRange: text("salary_range").notNull().default("—"),
    seniority: text("seniority").notNull().default("unknown"),
    matchScore: real("match_score").notNull().default(0),
    matchTier: text("match_tier").notNull().default("weak"),
    avatarText: text("avatar_text").notNull().default("?"),
    avatarColorClass: text("avatar_color_class").notNull().default(""),
    postedAt: text("posted_at").notNull().default(""),
    nextStepDate: text("next_step_date"),
    /**
     * When auto question-gen last completed for this job.
     * Null → eligible (apply / import). Prevents re-running same job forever.
     */
    questionsGeneratedAt: timestamp("questions_generated_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("tracked_jobs_user_source_uidx").on(table.userId, table.sourceKey),
    index("tracked_jobs_user_status_idx").on(table.userId, table.status),
    index("tracked_jobs_user_updated_idx").on(table.userId, table.updatedAt),
  ]
)

export type TrackedJobRow = typeof trackedJobs.$inferSelect
export type NewTrackedJobRow = typeof trackedJobs.$inferInsert
