import { and, desc, eq, inArray } from "drizzle-orm"
import type {
  TrackedJobDto,
  TrackedJobUpsertInput,
  TrackingStatus,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import { trackedJobs, type TrackedJobRow } from "../../db/schema/tracked-jobs.js"
import { getRedis } from "../../lib/redis.js"
import { logger } from "../../lib/logger.js"
import { env } from "../../config/env.js"
import { generateQuestionsFromJobs } from "../questions/generate.js"

export type QuestionGenStatus =
  | "started"
  | "skipped_already"
  | "skipped_no_flag"
  | "skipped_no_key"

export type UpsertTrackedJobResult = {
  job: TrackedJobDto
  questionGen: QuestionGenStatus
}

function toDto(row: TrackedJobRow): TrackedJobDto {
  return {
    id: row.id,
    sourceKey: row.sourceKey,
    provider: row.provider,
    externalId: row.externalId,
    title: row.title,
    company: row.company,
    location: row.location,
    description: row.description,
    applyUrl: row.applyUrl,
    status: row.status,
    salaryRange: row.salaryRange,
    seniority: row.seniority as TrackedJobDto["seniority"],
    matchScore: row.matchScore,
    matchTier: row.matchTier as TrackedJobDto["matchTier"],
    avatarText: row.avatarText,
    avatarColorClass: row.avatarColorClass,
    postedAt: row.postedAt,
    nextStepDate: row.nextStepDate,
    questionsGeneratedAt: row.questionsGeneratedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function upsertValues(userId: string, input: TrackedJobUpsertInput) {
  return {
    userId,
    sourceKey: input.sourceKey,
    provider: input.provider,
    externalId: input.externalId ?? null,
    title: input.title,
    company: input.company,
    location: input.location,
    description: input.description ?? null,
    applyUrl: input.applyUrl ?? null,
    status: input.status,
    salaryRange: input.salaryRange,
    seniority: input.seniority,
    matchScore: input.matchScore,
    matchTier: input.matchTier,
    avatarText: input.avatarText,
    avatarColorClass: input.avatarColorClass,
    postedAt: input.postedAt,
    nextStepDate: input.nextStepDate ?? null,
    updatedAt: new Date(),
  }
}

export async function listTrackedJobs(
  db: Database,
  userId: string,
  status?: TrackingStatus
): Promise<TrackedJobDto[]> {
  const rows = await db
    .select()
    .from(trackedJobs)
    .where(
      status
        ? and(eq(trackedJobs.userId, userId), eq(trackedJobs.status, status))
        : eq(trackedJobs.userId, userId)
    )
    .orderBy(desc(trackedJobs.updatedAt))

  return rows.map(toDto)
}

/**
 * Upsert a tracked job. When `generateQuestions` is true (Discover apply /
 * Import job), kick off global bank generation once per job (deduped inserts).
 */
export async function upsertTrackedJob(
  db: Database,
  userId: string,
  input: TrackedJobUpsertInput
): Promise<UpsertTrackedJobResult> {
  const values = upsertValues(userId, input)
  const [row] = await db
    .insert(trackedJobs)
    .values(values)
    .onConflictDoUpdate({
      target: [trackedJobs.userId, trackedJobs.sourceKey],
      set: {
        provider: values.provider,
        externalId: values.externalId,
        title: values.title,
        company: values.company,
        location: values.location,
        description: values.description,
        applyUrl: values.applyUrl,
        status: values.status,
        salaryRange: values.salaryRange,
        seniority: values.seniority,
        matchScore: values.matchScore,
        matchTier: values.matchTier,
        avatarText: values.avatarText,
        avatarColorClass: values.avatarColorClass,
        postedAt: values.postedAt,
        nextStepDate: values.nextStepDate,
        updatedAt: values.updatedAt,
      },
    })
    .returning()

  if (!row) throw new Error("tracked_job_upsert_failed")

  const questionGen = await maybeStartQuestionGeneration(
    db,
    userId,
    row,
    Boolean(input.generateQuestions)
  )

  return { job: toDto(row), questionGen }
}

async function maybeStartQuestionGeneration(
  db: Database,
  userId: string,
  row: TrackedJobRow,
  flag: boolean
): Promise<QuestionGenStatus> {
  if (!flag) return "skipped_no_flag"
  if (row.questionsGeneratedAt) return "skipped_already"
  if (!env.OPENROUTER_API_KEY) return "skipped_no_key"

  const lockKey = `qgen:tracked:${row.id}`
  const redis = getRedis()
  const locked = await redis.set(lockKey, "1", "EX", 600, "NX")
  if (locked !== "OK") return "skipped_already"

  // Fire-and-forget — apply/import stays snappy; bank fills when model returns
  void (async () => {
    try {
      const result = await generateQuestionsFromJobs(db, userId, [row.id])
      logger.info(
        {
          userId,
          trackedJobId: row.id,
          result,
        },
        "auto_question_gen_finished"
      )
    } catch (err) {
      logger.error(
        { err, userId, trackedJobId: row.id },
        "auto_question_gen_failed"
      )
    } finally {
      await redis.del(lockKey).catch(() => {})
    }
  })()

  return "started"
}

export async function updateTrackedJobStatus(
  db: Database,
  userId: string,
  id: string,
  status: TrackingStatus
): Promise<TrackedJobDto | null> {
  const [row] = await db
    .update(trackedJobs)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(trackedJobs.id, id), eq(trackedJobs.userId, userId)))
    .returning()
  return row ? toDto(row) : null
}

export async function replaceTrackedJobStatuses(
  db: Database,
  userId: string,
  updates: ReadonlyArray<{ id: string; status: TrackingStatus }>
): Promise<number> {
  let changed = 0
  for (const u of updates) {
    const row = await updateTrackedJobStatus(db, userId, u.id, u.status)
    if (row) changed += 1
  }
  return changed
}

export async function removeTrackedJob(
  db: Database,
  userId: string,
  id: string
): Promise<boolean> {
  const deleted = await db
    .delete(trackedJobs)
    .where(and(eq(trackedJobs.id, id), eq(trackedJobs.userId, userId)))
    .returning({ id: trackedJobs.id })
  return deleted.length > 0
}

export async function removeTrackedJobBySourceKey(
  db: Database,
  userId: string,
  sourceKey: string
): Promise<boolean> {
  const deleted = await db
    .delete(trackedJobs)
    .where(
      and(eq(trackedJobs.userId, userId), eq(trackedJobs.sourceKey, sourceKey))
    )
    .returning({ id: trackedJobs.id })
  return deleted.length > 0
}

/** One-shot localStorage migration — upsert each job; skip empty. No auto-gen. */
export async function importLocalTrackedJobs(
  db: Database,
  userId: string,
  jobs: TrackedJobUpsertInput[]
): Promise<{ imported: number; total: number }> {
  if (jobs.length === 0) return { imported: 0, total: 0 }

  const existing = await db
    .select({ sourceKey: trackedJobs.sourceKey })
    .from(trackedJobs)
    .where(eq(trackedJobs.userId, userId))

  const have = new Set(existing.map((r) => r.sourceKey))
  let imported = 0

  for (const job of jobs) {
    if (have.has(job.sourceKey)) continue
    await upsertTrackedJob(db, userId, { ...job, generateQuestions: false })
    have.add(job.sourceKey)
    imported += 1
  }

  return { imported, total: jobs.length }
}

export async function getTrackedJobById(
  db: Database,
  userId: string,
  id: string
): Promise<TrackedJobDto | null> {
  const [row] = await db
    .select()
    .from(trackedJobs)
    .where(and(eq(trackedJobs.id, id), eq(trackedJobs.userId, userId)))
    .limit(1)
  return row ? toDto(row) : null
}

export async function listSourceKeys(
  db: Database,
  userId: string,
  sourceKeys: string[]
): Promise<string[]> {
  if (sourceKeys.length === 0) return []
  const rows = await db
    .select({ sourceKey: trackedJobs.sourceKey })
    .from(trackedJobs)
    .where(
      and(
        eq(trackedJobs.userId, userId),
        inArray(trackedJobs.sourceKey, sourceKeys)
      )
    )
  return rows.map((r) => r.sourceKey)
}
