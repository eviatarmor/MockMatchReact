import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core"

/**
 * Question bank schema stubs.
 * Search support (not implemented yet):
 * - Add generated/stored `tsvector` + GIN for keyword search
 * - Add nullable `vector(N)` embedding column (dimension TBD via OpenRouter) for semantic search
 * - Reindex via domain events `questions.upserted` / `questions.deleted` → BullMQ `indexing` queue
 */

export const questionDomainEnum = pgEnum("question_domain", [
  "coding",
  "systemDesign",
  "caseStudy",
  "product",
  "behavioral",
  "finance",
  "clinical",
])

export const questionDifficultyEnum = pgEnum("question_difficulty", [
  "easy",
  "medium",
  "hard",
])

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  domain: questionDomainEnum("domain").notNull(),
  difficulty: questionDifficultyEnum("difficulty").notNull(),
  company: text("company"),
  body: text("body"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("questions_domain_idx").on(table.domain),
  index("questions_difficulty_idx").on(table.difficulty),
  index("questions_company_idx").on(table.company),
])
