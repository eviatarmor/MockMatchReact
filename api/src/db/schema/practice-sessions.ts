import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { ideWorkspaces } from "./ide-workspaces.js"
import { questions } from "./questions.js"
import { users } from "./users.js"

/** IDE / code-run practice attempt (retakes = separate rows). */
export const practiceSessionStatusEnum = pgEnum("practice_session_status", [
  "in_progress",
  "completed",
  "abandoned",
])

export const practiceSessions = pgTable(
  "practice_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Exercise slug / track id (js-sum, gen-abc123, shell, …). */
    trackId: text("track_id").notNull(),
    title: text("title").notNull(),
    workspaceId: uuid("workspace_id").references(() => ideWorkspaces.id, {
      onDelete: "set null",
    }),
    questionId: uuid("question_id").references(() => questions.id, {
      onDelete: "set null",
    }),
    status: practiceSessionStatusEnum("status")
      .notNull()
      .default("in_progress"),
    score: integer("score"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("practice_sessions_user_updated_idx").on(
      table.userId,
      table.updatedAt
    ),
    index("practice_sessions_user_track_status_idx").on(
      table.userId,
      table.trackId,
      table.status
    ),
  ]
)

export type PracticeSessionRow = typeof practiceSessions.$inferSelect
