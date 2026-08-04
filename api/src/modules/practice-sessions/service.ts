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
  boardId: string | null
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
    boardId: row.boardId,
    questionId: row.questionId,
    status: row.status,
    score: row.score,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * Older practice only wrote ide_workspaces / whiteboard_boards without a
 * practice_sessions history row. Backfill on list so Simulations history
 * shows real past attempts (latest board per question; unlinked workspaces).
 */
async function ensurePracticeHistoryFromArtifacts(
  db: Database,
  userId: string
): Promise<void> {
  const linked = await db
    .select({
      workspaceId: practiceSessions.workspaceId,
      boardId: practiceSessions.boardId,
    })
    .from(practiceSessions)
    .where(eq(practiceSessions.userId, userId))

  const linkedWorkspaceIds = new Set(
    linked.map((r) => r.workspaceId).filter((id): id is string => Boolean(id))
  )
  const linkedBoardIds = new Set(
    linked.map((r) => r.boardId).filter((id): id is string => Boolean(id))
  )

  // Latest board per bank question (skip remount storm duplicates).
  const boardResult = await db.execute(sql`
    SELECT DISTINCT ON (question_id)
      id,
      title,
      question_id,
      status,
      created_at,
      updated_at
    FROM whiteboard_boards
    WHERE user_id = ${userId}
      AND question_id IS NOT NULL
    ORDER BY question_id, updated_at DESC
  `)
  const boards = (
    Array.isArray(boardResult)
      ? boardResult
      : ((boardResult as { rows?: unknown[] }).rows ?? [])
  ) as Array<{
    id: string
    title: string
    question_id: string
    status: string
    created_at: Date | string
    updated_at: Date | string
  }>

  const newBoardSessions = boards
    .filter((b) => b.question_id && !linkedBoardIds.has(b.id))
    .map((b) => {
      const createdAt =
        b.created_at instanceof Date ? b.created_at : new Date(b.created_at)
      const updatedAt =
        b.updated_at instanceof Date ? b.updated_at : new Date(b.updated_at)
      return {
        userId,
        trackId: questionTrackId(b.question_id),
        title: b.title || "Whiteboard",
        boardId: b.id,
        questionId: b.question_id,
        workspaceId: null as string | null,
        status: (b.status === "archived" ? "abandoned" : "in_progress") as
          | "in_progress"
          | "completed"
          | "abandoned",
        startedAt: createdAt,
        updatedAt,
        endedAt: b.status === "archived" ? updatedAt : null,
      }
    })

  const workspaceRows = await db
    .select()
    .from(ideWorkspaces)
    .where(eq(ideWorkspaces.userId, userId))
    .orderBy(desc(ideWorkspaces.updatedAt))
    .limit(80)

  const newWorkspaceSessions = workspaceRows
    .filter((w) => !linkedWorkspaceIds.has(w.id))
    .map((w) => {
      const slug = w.templateId?.trim() || "workspace"
      return {
        userId,
        trackId: slug,
        title: w.title || slug,
        workspaceId: w.id,
        boardId: null as string | null,
        questionId: parseQuestionTrackId(slug),
        status: (w.status === "archived" ? "abandoned" : "in_progress") as
          | "in_progress"
          | "completed"
          | "abandoned",
        startedAt: w.createdAt,
        updatedAt: w.updatedAt,
        endedAt: w.status === "archived" ? w.updatedAt : null,
      }
    })

  const toInsert = [...newBoardSessions, ...newWorkspaceSessions]
  if (toInsert.length === 0) return

  const CHUNK = 50
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    await db.insert(practiceSessions).values(toInsert.slice(i, i + CHUNK))
  }
}

export async function listPracticeSessions(
  db: Database,
  userId: string,
  opts?: { page?: number; pageSize?: number; search?: string }
) {
  // Recover history for users who only have boards/workspaces (no session rows).
  try {
    await ensurePracticeHistoryFromArtifacts(db, userId)
  } catch (err) {
    console.error("[practice-sessions] history backfill failed", err)
  }

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

  // IDE attempts need a live workspace; whiteboard uses boardId only.
  if (row.workspaceId) {
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

/**
 * Whiteboard practice attempt — links board, no IDE workspace.
 */
export async function startWhiteboardPracticeSession(
  db: Database,
  userId: string,
  input: {
    questionId: string
    boardId: string
    title?: string
    abandonOpen?: boolean
  }
): Promise<PracticeSessionDto> {
  const trackId = questionTrackId(input.questionId)
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

  const [session] = await db
    .insert(practiceSessions)
    .values({
      userId,
      trackId,
      title: input.title?.trim() || "Whiteboard",
      boardId: input.boardId,
      questionId: input.questionId,
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
  return toDto(session)
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
