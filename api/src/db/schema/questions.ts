import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { vector1536 } from "./vector.js"

/**
 * Global question bank (shared pool / “bucket”).
 *
 * - Metadata + format + payload live here for every surface
 *   (conversation, single-file code_run, future workspace / terminal).
 * - File bodies: `content_cache` (dev) + optional S3 under `content_prefix`
 *   (`questions/<id>/v1/…`) — same pattern as practice_exercises.
 * - Semantic dedupe: `content_hash` + pgvector `embedding`.
 * - Runnable code_run rows may also promote a `practice_exercises` slug for IDE.
 */

export const questionDomainEnum = pgEnum("question_domain", [
  "coding",
  "systemDesign",
  "caseStudy",
  "product",
  "behavioral",
  "finance",
  "clinical",
  "dataScience",
  "ml",
  "security",
  "devops",
  "design",
  "consulting",
  "marketing",
  "sales",
])

export const questionDifficultyEnum = pgEnum("question_difficulty", [
  "easy",
  "medium",
  "hard",
])

/** How the candidate practices this question. */
export const questionFormatEnum = pgEnum("question_format", [
  "conversation",
  "code_run",
  "workspace",
  "terminal",
  "whiteboard",
  "mcq",
])

export const questionSourceEnum = pgEnum("question_source", [
  "seed",
  "generated",
  "manual",
])

export const questionPublishStatusEnum = pgEnum("question_publish_status", [
  "draft",
  "published",
  "archived",
])

export type ConversationQuestionPayload = {
  interviewerPrompt: string
  followUps?: string[]
  rubric?: string
  trackHint?: string
}

export type CodeRunQuestionPayload = {
  prompt: string
  language: string
  /** Single-file starter (legacy + simple problems). */
  starterCode?: string
  /** Multi-file map path → body (one-file or small workspace). */
  files?: Record<string, string>
  tests?: Array<{
    name: string
    stdin?: string
    expectedStdout?: string
  }>
  entryPath?: string
  durationMin?: number
  /** Linked practice_exercises.slug for IDE. */
  exerciseSlug?: string
}

export type WorkspaceQuestionPayload = {
  prompt: string
  files: Record<string, string>
  tree?: unknown
  durationMin?: number
}

/** Pick-the-right-answer (single correct). */
export type McqQuestionPayload = {
  stem: string
  /** 2–6 choices */
  options: string[]
  /** 0-based index into options */
  correctIndex: number
  explanation?: string
}

export type QuestionPayload =
  | ConversationQuestionPayload
  | CodeRunQuestionPayload
  | WorkspaceQuestionPayload
  | McqQuestionPayload
  | Record<string, unknown>

/** path → file body (local/dev mirror of S3 content_prefix). */
export type QuestionContentCache = Record<string, string>

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    domain: questionDomainEnum("domain").notNull(),
    difficulty: questionDifficultyEnum("difficulty").notNull(),
    company: text("company"),
    body: text("body"),
    format: questionFormatEnum("format").notNull().default("conversation"),
    /** Format-specific structured content (prompts, tests, track hints). */
    payload: jsonb("payload").$type<QuestionPayload>().notNull().default({}),
    language: text("language"),
    roleFamilies: jsonb("role_families").$type<string[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    source: questionSourceEnum("source").notNull().default("manual"),
    /** Optional fingerprint of JD slice that produced this (analytics). */
    sourceFingerprint: text("source_fingerprint"),
    /**
     * S3 key prefix for multi-file / large assets, e.g. `questions/<id>/v1/`.
     * Empty for pure-text conversation items.
     */
    contentPrefix: text("content_prefix"),
    contentVersion: text("content_version").default("v1"),
    /** Inline file bodies for local/dev (code_run / workspace). */
    contentCache: jsonb("content_cache")
      .$type<QuestionContentCache>()
      .notNull()
      .default({}),
    searchDocument: text("search_document").notNull().default(""),
    /** Exact-dup key: normalize(title|body|format|language). */
    contentHash: text("content_hash").notNull(),
    embedding: vector1536("embedding"),
    embeddingModel: text("embedding_model"),
    embeddingAt: timestamp("embedding_at", { withTimezone: true }),
    status: questionPublishStatusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("questions_content_hash_uidx").on(table.contentHash),
    index("questions_domain_idx").on(table.domain),
    index("questions_difficulty_idx").on(table.difficulty),
    index("questions_company_idx").on(table.company),
    index("questions_format_idx").on(table.format),
    index("questions_status_idx").on(table.status),
  ]
)

export type QuestionRow = typeof questions.$inferSelect
export type NewQuestionRow = typeof questions.$inferInsert
