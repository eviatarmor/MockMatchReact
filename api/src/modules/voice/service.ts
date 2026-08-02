import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "../../db/client.js"
import { questions } from "../../db/schema/questions.js"
import { voiceSessions } from "../../db/schema/voice-sessions.js"
import { env } from "../../config/env.js"
import { signVoiceTicket } from "../../lib/jwt.js"
import {
  newTicketJti,
  pickVoiceWorker,
  storeVoiceTicket,
} from "../../lib/voice-store.js"
import { spendCredits } from "../billing/credits.js"

const TICKET_TTL_SECONDS = 10 * 60

const KIND_PROMPTS: Record<string, string> = {
  practice:
    "You are a supportive interview coach. Guide the candidate through practice answers; ask follow-ups.",
  fullInterview:
    "You are a formal interviewer. Run a realistic mock interview; stay in role; limited coaching.",
  freeform:
    "You are a flexible interview prep partner. Follow the candidate's agenda while staying professional.",
}

export type CreateVoiceSessionInput = {
  userId: string
  trackId: string
  sessionKind: "practice" | "fullInterview" | "freeform"
  voiceId: string
  analyzeFace: boolean
  analyzePosture: boolean
  /** Optional global bank question — seeds interviewer system prompt. */
  questionId?: string
}

function buildIceServers(): Array<Record<string, unknown>> {
  const servers: Array<Record<string, unknown>> = []
  for (const u of env.VOICE_ICE_STUN_URLS.split(",")) {
    const url = u.trim()
    if (url) servers.push({ urls: [url] })
  }
  const turnUrls = env.VOICE_ICE_TURN_URLS.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (turnUrls.length && env.VOICE_ICE_TURN_USERNAME && env.VOICE_ICE_TURN_CREDENTIAL) {
    servers.push({
      urls: turnUrls,
      username: env.VOICE_ICE_TURN_USERNAME,
      credential: env.VOICE_ICE_TURN_CREDENTIAL,
    })
  }
  if (servers.length === 0) {
    servers.push({ urls: ["stun:stun.l.google.com:19302"] })
  }
  return servers
}

export async function createVoiceSession(input: CreateVoiceSessionInput) {
  const fallbackUrl = (env.VOICE_PUBLIC_URL || env.VOICE_SERVICE_URL || "").replace(
    /\/$/,
    ""
  )

  const worker = await pickVoiceWorker()
  const offerBase = worker?.publicUrl || fallbackUrl
  if (!offerBase) {
    return {
      ok: false as const,
      code: "not_configured" as const,
      message:
        "No voice worker registered and VOICE_SERVICE_URL / VOICE_PUBLIC_URL empty",
    }
  }

  // Credit gate (0 = free testing)
  const cost = env.VOICE_SESSION_CREDIT_COST
  if (cost > 0) {
    const spend = await spendCredits(db, input.userId, cost, "mockInterviews")
    if (!spend.ok) {
      return {
        ok: false as const,
        code: "insufficient_credits" as const,
        message: `Need ${cost} credits for a live agent session`,
        remaining: spend.remaining,
      }
    }
  }

  let questionPrompt = ""
  let resolvedQuestionId: string | null = null
  if (input.questionId) {
    const [q] = await db
      .select({
        id: questions.id,
        title: questions.title,
        body: questions.body,
        payload: questions.payload,
        format: questions.format,
      })
      .from(questions)
      .where(eq(questions.id, input.questionId))
      .limit(1)
    if (q && q.format === "conversation") {
      resolvedQuestionId = q.id
      const payload = q.payload as {
        interviewerPrompt?: string
        followUps?: string[]
        rubric?: string
      }
      questionPrompt = [
        `Focus question: ${q.title}.`,
        payload.interviewerPrompt || q.body || "",
        payload.followUps?.length
          ? `Suggested follow-ups: ${payload.followUps.join(" | ")}`
          : "",
        payload.rubric ? `Rubric notes: ${payload.rubric}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    }
  }

  const systemPrompt = [
    KIND_PROMPTS[input.sessionKind] ?? KIND_PROMPTS.practice,
    `Track id: ${input.trackId}.`,
    questionPrompt,
    "Keep spoken replies short (2–4 sentences).",
    input.analyzeFace
      ? "Note: facial analysis is enabled on the client (UI flag only for now)."
      : "",
    input.analyzePosture
      ? "Note: posture analysis is enabled on the client (UI flag only for now)."
      : "",
  ]
    .filter(Boolean)
    .join(" ")

  const [row] = await db
    .insert(voiceSessions)
    .values({
      userId: input.userId,
      trackId: input.trackId,
      questionId: resolvedQuestionId,
      sessionKind: input.sessionKind,
      voiceId: input.voiceId,
      analyzeFace: input.analyzeFace,
      analyzePosture: input.analyzePosture,
      status: "ready",
      systemPrompt,
      startedAt: new Date(),
    })
    .returning()

  if (!row) {
    return {
      ok: false as const,
      code: "db_error" as const,
      message: "Failed to create session",
    }
  }

  const jti = newTicketJti()
  const offerUrl = `${offerBase}/api/offer`
  await storeVoiceTicket(
    jti,
    {
      sessionId: row.id,
      userId: input.userId,
      trackId: input.trackId,
      sessionKind: input.sessionKind,
      voiceId: input.voiceId,
      analyzeFace: input.analyzeFace,
      analyzePosture: input.analyzePosture,
      systemPrompt,
      workerId: worker?.id,
      offerUrl,
    },
    TICKET_TTL_SECONDS
  )

  const ticket = await signVoiceTicket({
    userId: input.userId,
    sessionId: row.id,
    jti,
  })

  return {
    ok: true as const,
    session: {
      id: row.id,
      trackId: row.trackId,
      sessionKind: row.sessionKind,
      voiceId: row.voiceId,
      status: row.status,
      analyzeFace: row.analyzeFace,
      analyzePosture: row.analyzePosture,
    },
    ticket,
    offerUrl,
    workerId: worker?.id ?? null,
    iceServers: buildIceServers(),
    eventsUrl: `${env.API_URL.replace(/\/$/, "")}/voice/sessions/${row.id}/events`,
    llmModel: env.PIPECAT_LLM_MODEL,
    creditsCharged: cost,
  }
}

export async function endVoiceSession(input: {
  userId: string
  sessionId: string
}) {
  const [row] = await db
    .select()
    .from(voiceSessions)
    .where(eq(voiceSessions.id, input.sessionId))
    .limit(1)

  if (!row || row.userId !== input.userId) {
    return { ok: false as const, code: "not_found" as const }
  }

  await db
    .update(voiceSessions)
    .set({
      status: "ended",
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(voiceSessions.id, input.sessionId))

  return { ok: true as const }
}

export async function getVoiceSession(input: {
  userId: string
  sessionId: string
}) {
  const [row] = await db
    .select()
    .from(voiceSessions)
    .where(eq(voiceSessions.id, input.sessionId))
    .limit(1)

  if (!row || row.userId !== input.userId) {
    return null
  }
  return row
}

export type ListVoiceSessionsInput = {
  userId: string
  page?: number
  pageSize?: number
  search?: string
}

export async function listVoiceSessions(input: ListVoiceSessionsInput) {
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 10
  const offset = (page - 1) * pageSize

  const filters = [eq(voiceSessions.userId, input.userId)]
  if (input.search?.trim()) {
    const q = `%${input.search.trim().toLowerCase()}%`
    filters.push(
      sql`(lower(${voiceSessions.trackId}) like ${q} or lower(${voiceSessions.status}) like ${q})`
    )
  }
  const where = and(...filters)

  const rows = await db
    .select()
    .from(voiceSessions)
    .where(where)
    .orderBy(desc(voiceSessions.updatedAt))
    .limit(pageSize)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(voiceSessions)
    .where(where)

  return {
    items: rows,
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function deleteVoiceSession(input: {
  userId: string
  sessionId: string
}) {
  const deleted = await db
    .delete(voiceSessions)
    .where(
      and(
        eq(voiceSessions.id, input.sessionId),
        eq(voiceSessions.userId, input.userId)
      )
    )
    .returning({ id: voiceSessions.id })
  return deleted.length > 0
}
