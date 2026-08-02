import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { questions } from "./questions.js"
import { users } from "./users.js"

/** Per-user mastery overlay on the global question bank. */
export const userQuestionStatusEnum = pgEnum("user_question_status", [
  "new",
  "attempted",
  "mastered",
])

export const userQuestionProgress = pgTable(
  "user_question_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    status: userQuestionStatusEnum("status").notNull().default("new"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.questionId] }),
  ]
)

export type UserQuestionProgressRow = typeof userQuestionProgress.$inferSelect
