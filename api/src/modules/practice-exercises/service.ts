import { and, asc, eq, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type { Database } from "../../db/client.js"
import {
  practiceExercises,
  type ExerciseContentCache,
  type ExerciseUiFlags,
} from "../../db/schema/practice-exercises.js"
import { loadExerciseFiles, uploadExerciseContentToS3 } from "./content.js"
import {
  EXERCISE_SEEDS,
  buildSearchDocument,
  contentPrefixFor,
} from "./seed-data.js"
import { logger } from "../../lib/logger.js"

export type PracticeExerciseListItem = {
  id: string
  slug: string
  title: string
  description: string
  format: string
  layout: string
  domain: string
  difficulty: string
  languages: string[]
  roleFamilies: string[]
  tags: string[]
  durationMin: number
  uiFlags: ExerciseUiFlags
}

export type PracticeExerciseDetail = PracticeExerciseListItem & {
  prompt: string
  aiContext: string
  contentPrefix: string
  contentVersion: string
  /** Resolved path → content (S3 or cache). */
  files: ExerciseContentCache
  tree: ExerciseUiFlags extends never ? never : unknown
  contentManifest: {
    tree: unknown
    files: Array<{ path: string; language?: string; contentType?: string }>
  }
  /** Workspace document shape for ideWorkspaces.create */
  document: {
    tree: unknown
    files: Record<string, { language?: string; content: string }>
  }
}

function toListItem(
  row: typeof practiceExercises.$inferSelect
): PracticeExerciseListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    format: row.format,
    layout: row.layout,
    domain: row.domain,
    difficulty: row.difficulty,
    languages: row.languages ?? [],
    roleFamilies: row.roleFamilies ?? [],
    tags: row.tags ?? [],
    durationMin: row.durationMin,
    uiFlags: row.uiFlags,
  }
}

export async function listPracticeExercises(
  db: Database,
  opts?: { format?: string; domain?: string; status?: string }
): Promise<PracticeExerciseListItem[]> {
  const conditions = [
    eq(practiceExercises.status, (opts?.status as "published") ?? "published"),
  ]
  if (opts?.format) {
    conditions.push(
      eq(
        practiceExercises.format,
        opts.format as "code_run" | "workspace" | "terminal"
      )
    )
  }
  if (opts?.domain) {
    conditions.push(
      eq(
        practiceExercises.domain,
        opts.domain as typeof practiceExercises.$inferSelect.domain
      )
    )
  }

  const rows = await db
    .select()
    .from(practiceExercises)
    .where(and(...conditions))
    .orderBy(asc(practiceExercises.slug))

  return rows.map(toListItem)
}

export async function getPracticeExerciseBySlug(
  db: Database,
  slug: string
): Promise<PracticeExerciseDetail> {
  const row = await db.query.practiceExercises.findFirst({
    where: eq(practiceExercises.slug, slug),
  })
  if (!row || row.status === "archived") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Exercise not found: ${slug}`,
    })
  }

  const files = await loadExerciseFiles({
    contentPrefix: row.contentPrefix,
    contentManifest: row.contentManifest,
    contentCache: row.contentCache ?? {},
  })

  const documentFiles: PracticeExerciseDetail["document"]["files"] = {}
  for (const meta of row.contentManifest.files) {
    documentFiles[meta.path] = {
      language: meta.language,
      content: files[meta.path] ?? "",
    }
  }

  return {
    ...toListItem(row),
    prompt: row.prompt,
    aiContext: row.aiContext,
    contentPrefix: row.contentPrefix,
    contentVersion: row.contentVersion,
    files,
    contentManifest: row.contentManifest,
    tree: row.contentManifest.tree,
    document: {
      tree: row.contentManifest.tree,
      files: documentFiles,
    },
  }
}

/**
 * Upsert catalog seeds + optional S3 upload.
 * Idempotent on slug.
 */
export async function seedPracticeExercises(
  db: Database,
  opts?: { uploadS3?: boolean }
): Promise<{ upserted: number; s3Uploaded: number }> {
  let upserted = 0
  let s3Uploaded = 0

  for (const seed of EXERCISE_SEEDS) {
    const prefix = contentPrefixFor(seed.slug, seed.contentVersion)
    const searchDocument = buildSearchDocument(seed)

    await db
      .insert(practiceExercises)
      .values({
        slug: seed.slug,
        title: seed.title,
        description: seed.description,
        prompt: seed.prompt,
        aiContext: seed.aiContext,
        format: seed.format,
        layout: seed.layout,
        domain: seed.domain,
        difficulty: seed.difficulty,
        status: "published",
        languages: seed.languages,
        roleFamilies: seed.roleFamilies,
        tags: seed.tags,
        durationMin: seed.durationMin,
        uiFlags: seed.uiFlags,
        contentPrefix: prefix,
        contentVersion: seed.contentVersion,
        contentManifest: seed.contentManifest,
        contentCache: seed.contentCache,
        searchDocument,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: practiceExercises.slug,
        set: {
          title: seed.title,
          description: seed.description,
          prompt: seed.prompt,
          aiContext: seed.aiContext,
          format: seed.format,
          layout: seed.layout,
          domain: seed.domain,
          difficulty: seed.difficulty,
          languages: seed.languages,
          roleFamilies: seed.roleFamilies,
          tags: seed.tags,
          durationMin: seed.durationMin,
          uiFlags: seed.uiFlags,
          contentPrefix: prefix,
          contentVersion: seed.contentVersion,
          contentManifest: seed.contentManifest,
          contentCache: seed.contentCache,
          searchDocument,
          updatedAt: new Date(),
        },
      })
    upserted += 1

    if (opts?.uploadS3) {
      try {
        const n = await uploadExerciseContentToS3({
          contentPrefix: prefix,
          contentManifest: seed.contentManifest,
          contentCache: seed.contentCache,
        })
        s3Uploaded += n
      } catch (err) {
        logger.warn({ err, slug: seed.slug }, "exercise S3 upload skipped/failed")
      }
    }
  }

  logger.info({ upserted, s3Uploaded }, "practice exercises seeded")
  return { upserted, s3Uploaded }
}

/** Touch embedding placeholder — worker will fill later. */
export async function clearExerciseEmbedding(
  db: Database,
  slug: string
): Promise<void> {
  await db
    .update(practiceExercises)
    .set({
      embedding: null,
      embeddingModel: null,
      embeddingAt: null,
      updatedAt: new Date(),
    })
    .where(eq(practiceExercises.slug, slug))
}

export async function countPracticeExercises(db: Database): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(practiceExercises)
  return Number(row?.n ?? 0)
}
