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

/** One history row per exercise track (latest updated wins). */
async function findSessionForTrack(
  db: Database,
  userId: string,
  trackId: string
) {
  const [row] = await db
    .select()
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.userId, userId),
        eq(practiceSessions.trackId, trackId)
      )
    )
    .orderBy(desc(practiceSessions.updatedAt))
    .limit(1)
  return row ?? null
}

/**
 * Drop older duplicate rows for the same track so history never shows retakes.
 * Keeps the latest `updated_at` per (user, track_id).
 */
async function pruneDuplicateSessions(
  db: Database,
  userId: string
): Promise<void> {
  await db.execute(sql`
    DELETE FROM practice_sessions ps
    USING practice_sessions newer
    WHERE ps.user_id = ${userId}
      AND newer.user_id = ps.user_id
      AND newer.track_id = ps.track_id
      AND (
        newer.updated_at > ps.updated_at
        OR (newer.updated_at = ps.updated_at AND newer.id > ps.id)
      )
  `)
}

/**
 * Older practice only wrote ide_workspaces / whiteboard_boards without a
 * practice_sessions history row. Backfill on list so Simulations history
 * shows real past attempts (one board per question; unlinked workspaces).
 */
async function ensurePracticeHistoryFromArtifacts(
  db: Database,
  userId: string
): Promise<void> {
  const linked = await db
    .select({
      workspaceId: practiceSessions.workspaceId,
      boardId: practiceSessions.boardId,
      trackId: practiceSessions.trackId,
    })
    .from(practiceSessions)
    .where(eq(practiceSessions.userId, userId))

  const linkedWorkspaceIds = new Set(
    linked.map((r) => r.workspaceId).filter((id): id is string => Boolean(id))
  )
  const linkedBoardIds = new Set(
    linked.map((r) => r.boardId).filter((id): id is string => Boolean(id))
  )
  const linkedTracks = new Set(linked.map((r) => r.trackId))

  // Latest board per bank question (one row per question forever).
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
    .filter((b) => {
      if (!b.question_id) return false
      const track = questionTrackId(b.question_id)
      // Skip if this board already linked, or track already has any session.
      if (linkedBoardIds.has(b.id)) return false
      if (linkedTracks.has(track)) return false
      return true
    })
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
    .filter((w) => {
      if (linkedWorkspaceIds.has(w.id)) return false
      const slug = w.templateId?.trim() || "workspace"
      // One session per track — skip if track already represented.
      if (linkedTracks.has(slug)) return false
      return true
    })
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

  // Dedupe inserts by trackId within this batch (prefer first = more recent board/ws).
  type InsertRow = {
    userId: string
    trackId: string
    title: string
    workspaceId: string | null
    boardId: string | null
    questionId: string | null
    status: "in_progress" | "completed" | "abandoned"
    startedAt: Date
    updatedAt: Date
    endedAt: Date | null
  }
  const byTrack = new Map<string, InsertRow>()
  for (const row of [...newBoardSessions, ...newWorkspaceSessions]) {
    if (!byTrack.has(row.trackId)) byTrack.set(row.trackId, row)
  }
  const toInsert = [...byTrack.values()]
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
  try {
    await ensurePracticeHistoryFromArtifacts(db, userId)
    await pruneDuplicateSessions(db, userId)
  } catch (err) {
    console.error("[practice-sessions] history backfill/prune failed", err)
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

/**
 * Latest practice record for a track (any status) when a workspace/board still exists.
 * Used to reopen the same exercise — not multi-session continue/start-new.
 */
export async function getOpenPracticeSession(
  db: Database,
  userId: string,
  trackId: string
): Promise<PracticeSessionDto | null> {
  const row = await findSessionForTrack(db, userId, trackId)
  if (!row) return null

  if (row.workspaceId) {
    const ws = await db.query.ideWorkspaces.findFirst({
      where: eq(ideWorkspaces.id, row.workspaceId),
      columns: { id: true },
    })
    if (!ws) {
      // Workspace gone — clear link so ensure/open can recreate once.
      await db
        .update(practiceSessions)
        .set({
          workspaceId: null,
          updatedAt: new Date(),
        })
        .where(eq(practiceSessions.id, row.id))
      return null
    }
  }

  return toDto(row)
}

/**
 * Open or create the single IDE practice record for a track/question.
 * Reuses existing workspace — never spawns retake sessions.
 */
export async function startNewPracticeSession(
  db: Database,
  userId: string,
  input: {
    trackId?: string
    questionId?: string | null
    /** @deprecated Ignored — multi-session abandoned; always reuse. */
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

  const existing = await findSessionForTrack(db, userId, trackId)
  if (existing?.workspaceId) {
    const ws = await db.query.ideWorkspaces.findFirst({
      where: eq(ideWorkspaces.id, existing.workspaceId),
      columns: { id: true },
    })
    if (ws) {
      const [touched] = await db
        .update(practiceSessions)
        .set({
          status: "in_progress",
          endedAt: null,
          updatedAt: new Date(),
          questionId: questionId ?? existing.questionId,
        })
        .where(eq(practiceSessions.id, existing.id))
        .returning()
      return {
        session: toDto(touched ?? existing),
        workspaceId: existing.workspaceId,
        questionId: questionId ?? existing.questionId,
      }
    }
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

  if (existing) {
    const [updated] = await db
      .update(practiceSessions)
      .set({
        title,
        workspaceId: ws.id,
        questionId: questionId,
        status: "in_progress",
        endedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(practiceSessions.id, existing.id))
      .returning()

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update practice session",
      })
    }
    return {
      session: toDto(updated),
      workspaceId: ws.id,
      questionId,
    }
  }

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
 * Link whiteboard board to the single history row for this bank question.
 */
export async function startWhiteboardPracticeSession(
  db: Database,
  userId: string,
  input: {
    questionId: string
    boardId: string
    title?: string
    /** @deprecated Ignored — multi-session abandoned; always upsert one row. */
    abandonOpen?: boolean
  }
): Promise<PracticeSessionDto> {
  const trackId = questionTrackId(input.questionId)
  const title = input.title?.trim() || "Whiteboard"
  const existing = await findSessionForTrack(db, userId, trackId)

  if (existing) {
    const [updated] = await db
      .update(practiceSessions)
      .set({
        title,
        boardId: input.boardId,
        questionId: input.questionId,
        status: "in_progress",
        endedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(practiceSessions.id, existing.id))
      .returning()
    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update whiteboard practice session",
      })
    }
    return toDto(updated)
  }

  const [session] = await db
    .insert(practiceSessions)
    .values({
      userId,
      trackId,
      title,
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

/**
 * Bind an existing workspace to the single session row for this track.
 */
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
  const existing = await findSessionForTrack(db, userId, input.trackId)
  if (existing) {
    const [updated] = await db
      .update(practiceSessions)
      .set({
        workspaceId: input.workspaceId,
        title: input.title ?? existing.title,
        questionId: input.questionId ?? existing.questionId,
        status: "in_progress",
        endedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(practiceSessions.id, existing.id))
      .returning()
    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to attach practice session",
      })
    }
    return toDto(updated)
  }

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
