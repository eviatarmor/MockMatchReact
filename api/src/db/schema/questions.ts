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
import { sql } from "drizzle-orm"
import { users } from "./users.js"
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
  "spreadsheet",
  "page",
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

/**
 * Who can see a bank row.
 * - global: shared pool (owner_user_id must be null)
 * - self: private to owner_user_id (team/org publish is not supported)
 */
export const questionVisibilityEnum = pgEnum("question_visibility", [
  "global",
  "self",
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

/** MCQ interaction mode. Default `single` when omitted (legacy rows). */
export type McqVariant = "single" | "multi" | "order"

/**
 * Pick / multi-select / order answers.
 * - single: `correctIndex`
 * - multi: `correctIndices` (one or more)
 * - order: `correctOrder` = permutation of option indices in correct sequence
 */
export type McqQuestionPayload = {
  stem: string
  /** 2–6 choices */
  options: string[]
  variant?: McqVariant
  /** single — 0-based index into options */
  correctIndex?: number
  /** multi — indices of all correct options */
  correctIndices?: number[]
  /** order — correct sequence as option indices */
  correctOrder?: number[]
  explanation?: string
}

export type WhiteboardQuestionPayload = {
  prompt: string
  durationMin?: number
  /** Optional starter board (element map). */
  starterBoard?: {
    version: 1
    elements: Record<string, unknown>
  }
  defaultTemplateId?: string
  rubric?: string
}

/** Case / finance table practice. */
export type SpreadsheetQuestionPayload = {
  prompt: string
  durationMin?: number
  rubric?: string
  starterWorkbook?: {
    version: 1
    sheets: Array<{
      id: string
      name: string
      cells: Record<string, { raw: string }>
      rowCount: number
      colCount: number
    }>
    activeSheetId: string
  }
}

/** Freeform document analysis / writeup practice. */
export type PageQuestionPayload = {
  prompt: string
  durationMin?: number
  rubric?: string
  starterHtml?: string
}

export type QuestionPayload =
  | ConversationQuestionPayload
  | CodeRunQuestionPayload
  | WorkspaceQuestionPayload
  | McqQuestionPayload
  | WhiteboardQuestionPayload
  | SpreadsheetQuestionPayload
  | PageQuestionPayload
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
     * Owning user for custom / self-scoped rows.
     * Null for the shared global bank (seed + job-generated).
     */
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    /**
     * global = shared bank; self = private to ownerUserId.
     * Team/org visibility is intentionally not modeled.
     */
    visibility: questionVisibilityEnum("visibility")
      .notNull()
      .default("global"),
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
    /** Shared bank: one content_hash globally. */
    uniqueIndex("questions_global_content_hash_uidx")
      .on(table.contentHash)
      .where(sql`${table.ownerUserId} is null`),
    /** Custom: unique per owner so two users may write the same prompt. */
    uniqueIndex("questions_self_content_hash_uidx")
      .on(table.ownerUserId, table.contentHash)
      .where(sql`${table.ownerUserId} is not null`),
    index("questions_domain_idx").on(table.domain),
    index("questions_difficulty_idx").on(table.difficulty),
    index("questions_company_idx").on(table.company),
    index("questions_format_idx").on(table.format),
    index("questions_status_idx").on(table.status),
    index("questions_owner_user_id_idx").on(table.ownerUserId),
    index("questions_visibility_idx").on(table.visibility),
    index("questions_owner_status_idx").on(table.ownerUserId, table.status),
  ]
)

export type QuestionRow = typeof questions.$inferSelect
export type NewQuestionRow = typeof questions.$inferInsert
