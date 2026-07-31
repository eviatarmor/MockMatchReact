import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  customType,
} from "drizzle-orm/pg-core"

/**
 * Practice exercise catalog (cpp-sort, react, shell, …).
 *
 * - Metadata lives in Postgres for listing, filters, AI generation, search.
 * - Workspace files live under S3 prefix `contentPrefix` (manifest lists paths).
 * - `contentCache` is a local/dev mirror of file bytes so rooms work without S3.
 * - `embedding` is nullable pgvector for later semantic retrieval.
 */

/** UI / runner environment for the exercise. */
export const exerciseFormatEnum = pgEnum("exercise_format", [
  "code_run",
  "workspace",
  "terminal",
])

/** How the client chrome should render. */
export const exerciseLayoutEnum = pgEnum("exercise_layout", [
  "ide",
  "editor",
  "shell",
])

export const exerciseDifficultyEnum = pgEnum("exercise_difficulty", [
  "easy",
  "medium",
  "hard",
])

export const exerciseStatusEnum = pgEnum("exercise_status", [
  "draft",
  "published",
  "archived",
])

/** Knowledge domain — aligned with future question bank / AI tagging. */
export const exerciseDomainEnum = pgEnum("exercise_domain", [
  "coding",
  "frontend",
  "backend",
  "devops",
  "system_design",
  "data",
  "product",
  "behavioral",
  "finance",
  "clinical",
  "general",
])

const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)"
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`
  },
  fromDriver(value: unknown): number[] {
    if (typeof value !== "string") return []
    const inner = value.replace(/^\[/, "").replace(/\]$/, "")
    if (!inner.trim()) return []
    return inner.split(",").map((n) => Number(n.trim()))
  },
})

export type ExerciseUiFlags = {
  treeEnabled: boolean
  defaultShowTree: boolean
  defaultShowTerminal: boolean
  openSeedTabs: boolean
  tabsClosable: boolean
  /** Paths to open as permanent tabs when openSeedTabs. */
  defaultOpenPaths?: string[]
  defaultExpandedIds?: string[]
  /** Shell lab extras */
  shellWelcome?: string
  shellCwd?: string
}

export type ExerciseTreeNode = {
  id: string
  name: string
  children?: ExerciseTreeNode[]
}

export type ExerciseFileMeta = {
  path: string
  language?: string
  contentType?: string
}

/** Manifest of files under contentPrefix (S3 keys = prefix + path). */
export type ExerciseContentManifest = {
  tree: ExerciseTreeNode[]
  files: ExerciseFileMeta[]
}

/** path → file body (dev fallback / seed mirror). */
export type ExerciseContentCache = Record<string, string>

export const practiceExercises = pgTable(
  "practice_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** URL / template key: cpp-sort, react, shell */
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    /** Short catalog blurb. */
    description: text("description").notNull(),
    /** Candidate-facing problem statement / instructions. */
    prompt: text("prompt").notNull().default(""),
    /**
     * Extra context for AI (rubric, traps, generation hints).
     * Not shown in default UI; used when generating variants / grading.
     */
    aiContext: text("ai_context").notNull().default(""),
    format: exerciseFormatEnum("format").notNull(),
    layout: exerciseLayoutEnum("layout").notNull(),
    domain: exerciseDomainEnum("domain").notNull().default("coding"),
    difficulty: exerciseDifficultyEnum("difficulty").notNull().default("medium"),
    status: exerciseStatusEnum("status").notNull().default("published"),
    /** Primary language tags e.g. ["typescript","react"] */
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    roleFamilies: jsonb("role_families")
      .$type<string[]>()
      .notNull()
      .default(["engineering"]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    durationMin: integer("duration_min").notNull().default(30),
    uiFlags: jsonb("ui_flags").$type<ExerciseUiFlags>().notNull(),
    /**
     * S3 key prefix, e.g. `exercises/cpp-sort/v1/`.
     * File at path `sort.cpp` → object key `${contentPrefix}sort.cpp`.
     */
    contentPrefix: text("content_prefix").notNull(),
    contentVersion: text("content_version").notNull().default("v1"),
    /** Tree + file metadata (paths, languages). */
    contentManifest: jsonb("content_manifest")
      .$type<ExerciseContentManifest>()
      .notNull(),
    /**
     * Inline file bodies for local/dev when S3 is empty.
     * Production seed should upload these to S3; API prefers S3 when configured.
     */
    contentCache: jsonb("content_cache")
      .$type<ExerciseContentCache>()
      .notNull()
      .default({}),
    /**
     * Denormalized text for FTS / embedding input:
     * title + description + prompt + tags + languages.
     */
    searchDocument: text("search_document").notNull().default(""),
    /** pgvector embedding for semantic search / AI retrieval (nullable until indexed). */
    embedding: vector1536("embedding"),
    embeddingModel: text("embedding_model"),
    embeddingAt: timestamp("embedding_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("practice_exercises_slug_uidx").on(table.slug),
    index("practice_exercises_format_idx").on(table.format),
    index("practice_exercises_domain_idx").on(table.domain),
    index("practice_exercises_difficulty_idx").on(table.difficulty),
    index("practice_exercises_status_idx").on(table.status),
  ]
)
