import { and, desc, eq, sql } from "drizzle-orm"
import type { Database } from "../../db/client.js"
import { practiceSessions } from "../../db/schema/practice-sessions.js"
import { ideWorkspaces } from "../../db/schema/ide-workspaces.js"
import { getPracticeExerciseBySlug } from "../practice-exercises/service.js"
import { createIdeWorkspace } from "../ide-workspaces/service.js"
import {
  getQuestionForPractice,
  parseQuestionTrackId,
  questionTrackId,
} from "../questions/service.js"
import { TRPCError } from "@trpc/server"

export type PracticeSessionDto = {
  id: string
  trackId: string
  title: string
  workspaceId: string | null
  questionId: string | null
  status: "in_progress" | "completed" | "abandoned"
  score: number | null
  startedAt: string
  endedAt: string | null
  updatedAt: string
  createdAt: string
}

function toDto(
  row: typeof practiceSessions.$inferSelect
): PracticeSessionDto {
  return {
    id: row.id,
    trackId: row.trackId,
    title: row.title,
    workspaceId: row.workspaceId,
    questionId: row.questionId,
    status: row.status,
    score: row.score,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listPracticeSessions(
  db: Database,
  userId: string,
  opts?: { page?: number; pageSize?: number; search?: string }
) {
  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 10
  const offset = (page - 1) * pageSize

  const filters = [eq(practiceSessions.userId, userId)]
  if (opts?.search?.trim()) {
    const q = `%${opts.search.trim().toLowerCase()}%`
    filters.push(
      sql`(lower(${practiceSessions.trackId}) like ${q} or lower(${practiceSessions.title}) like ${q} or lower(${practiceSessions.status}) like ${q})`
    )
  }
  const where = and(...filters)

  const rows = await db
    .select()
    .from(practiceSessions)
    .where(where)
    .orderBy(desc(practiceSessions.updatedAt))
    .limit(pageSize)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(practiceSessions)
    .where(where)

  return {
    items: rows.map(toDto),
    total: count ?? 0,
    page,
    pageSize,
  }
}

/** Latest in-progress attempt for a track (continue option). */
export async function getOpenPracticeSession(
  db: Database,
  userId: string,
  trackId: string
): Promise<PracticeSessionDto | null> {
  const [row] = await db
    .select()
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.userId, userId),
        eq(practiceSessions.trackId, trackId),
        eq(practiceSessions.status, "in_progress")
      )
    )
    .orderBy(desc(practiceSessions.updatedAt))
    .limit(1)

  if (!row?.workspaceId) return row ? toDto(row) : null

  // Ensure workspace still exists
  const ws = await db.query.ideWorkspaces.findFirst({
    where: eq(ideWorkspaces.id, row.workspaceId),
    columns: { id: true },
  })
  if (!ws) {
    await db
      .update(practiceSessions)
      .set({
        status: "abandoned",
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(practiceSessions.id, row.id))
    return null
  }

  return toDto(row)
}

/**
 * Start a new IDE practice attempt (creates workspace + session row).
 * - Seed catalog: trackId = exercise slug (js-sum, …)
 * - Bank question: questionId or trackId `q:<uuid>` → load from questions
 * Optionally abandon prior in-progress attempts for the same track.
 */
export async function startNewPracticeSession(
  db: Database,
  userId: string,
  input: {
    trackId?: string
    questionId?: string | null
    abandonOpen?: boolean
  }
): Promise<{
  session: PracticeSessionDto
  workspaceId: string
  questionId: string | null
}> {
  let questionId = input.questionId?.trim() || null
  let trackId = (input.trackId ?? "").trim()

  if (questionId) {
    trackId = questionTrackId(questionId)
  } else {
    const parsed = parseQuestionTrackId(trackId)
    if (parsed) questionId = parsed
  }

  if (!trackId && !questionId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "trackId or questionId required",
    })
  }
  if (!trackId && questionId) trackId = questionTrackId(questionId)

  if (input.abandonOpen !== false) {
    await db
      .update(practiceSessions)
      .set({
        status: "abandoned",
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(practiceSessions.userId, userId),
          eq(practiceSessions.trackId, trackId),
          eq(practiceSessions.status, "in_progress")
        )
      )
  }

  let title = trackId
  let document: Parameters<typeof createIdeWorkspace>[2]["document"]

  if (questionId) {
    const bank = await getQuestionForPractice(db, questionId)
    title = bank.title
    document = bank.document as NonNullable<typeof document>
    trackId = bank.trackId
  } else {
    try {
      const exercise = await getPracticeExerciseBySlug(db, trackId)
      title = exercise.title
      document = exercise.document as NonNullable<typeof document>
    } catch {
      // freeform / missing catalog — empty doc; workspace create uses defaults
    }
  }

  const ws = await createIdeWorkspace(db, userId, {
    title,
    templateId: trackId,
    document,
  })
  const [session] = await db
    .insert(practiceSessions)
    .values({
      userId,
      trackId,
      title,
      workspaceId: ws.id,
      questionId: questionId,
      status: "in_progress",
      startedAt: new Date(),
    })
    .returning()

  if (!session) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create practice session",
    })
  }

  return {
    session: toDto(session),
    workspaceId: ws.id,
    questionId,
  }
}

export async function touchPracticeSession(
  db: Database,
  userId: string,
  sessionId: string
) {
  await db
    .update(practiceSessions)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(practiceSessions.id, sessionId),
        eq(practiceSessions.userId, userId)
      )
    )
}

export async function completePracticeSession(
  db: Database,
  userId: string,
  sessionId: string,
  score?: number | null
) {
  const [row] = await db
    .update(practiceSessions)
    .set({
      status: "completed",
      score: score ?? null,
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(practiceSessions.id, sessionId),
        eq(practiceSessions.userId, userId)
      )
    )
    .returning()
  return row ? toDto(row) : null
}

export async function abandonPracticeSession(
  db: Database,
  userId: string,
  sessionId: string
) {
  const [row] = await db
    .update(practiceSessions)
    .set({
      status: "abandoned",
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(practiceSessions.id, sessionId),
        eq(practiceSessions.userId, userId)
      )
    )
    .returning()
  return row ? toDto(row) : null
}

export async function deletePracticeSession(
  db: Database,
  userId: string,
  sessionId: string
) {
  const deleted = await db
    .delete(practiceSessions)
    .where(
      and(
        eq(practiceSessions.id, sessionId),
        eq(practiceSessions.userId, userId)
      )
    )
    .returning({ id: practiceSessions.id })
  return deleted.length > 0
}

/** Bind an existing workspace to a new session row (when client already created WS). */
export async function attachWorkspaceSession(
  db: Database,
  userId: string,
  input: {
    trackId: string
    workspaceId: string
    title?: string
    questionId?: string | null
  }
): Promise<PracticeSessionDto> {
  const [session] = await db
    .insert(practiceSessions)
    .values({
      userId,
      trackId: input.trackId,
      title: input.title ?? input.trackId,
      workspaceId: input.workspaceId,
      questionId: input.questionId ?? null,
      status: "in_progress",
      startedAt: new Date(),
    })
    .returning()

  if (!session) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to attach practice session",
    })
  }
  return toDto(session)
}
