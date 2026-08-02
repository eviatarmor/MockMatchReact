import { z } from "zod"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import * as service from "./service.js"

const sessionKindSchema = z.enum(["practice", "fullInterview", "freeform"])

function mapSessionListItem(row: {
  id: string
  trackId: string
  sessionKind: string
  status: string
  startedAt: Date | null
  endedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  const start = row.startedAt?.getTime()
  const end = row.endedAt?.getTime()
  let durationMin = 0
  if (start != null && end != null && end >= start) {
    durationMin = Math.max(1, Math.round((end - start) / 60_000))
  }

  let uiStatus: "completed" | "in_progress" | "abandoned" = "in_progress"
  if (row.status === "ended") uiStatus = "completed"
  else if (row.status === "error") uiStatus = "abandoned"

  return {
    id: row.id,
    trackId: row.trackId,
    sessionKind: row.sessionKind,
    status: uiStatus,
    rawStatus: row.status,
    durationMin,
    score: null as number | null,
    updatedAt: (row.endedAt ?? row.updatedAt).toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

export const voiceRouter = router({
  createSession: protectedProcedure
    .input(
      z.object({
        trackId: z.string().min(1).max(128),
        sessionKind: sessionKindSchema.default("practice"),
        voiceId: z.string().min(1).max(64).default("mellow"),
        analyzeFace: z.boolean().default(false),
        analyzePosture: z.boolean().default(false),
        questionId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return service.createVoiceSession({
        userId: ctx.user.id,
        trackId: input.trackId,
        sessionKind: input.sessionKind,
        voiceId: input.voiceId,
        analyzeFace: input.analyzeFace,
        analyzePosture: input.analyzePosture,
        questionId: input.questionId,
      })
    }),

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await service.getVoiceSession({
        userId: ctx.user.id,
        sessionId: input.sessionId,
      })
      if (!row) return { ok: false as const, code: "not_found" as const }
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
          transcript: row.transcript ?? [],
          createdAt: row.createdAt,
          endedAt: row.endedAt,
        },
      }
    }),

  listSessions: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(10),
          search: z.string().trim().max(200).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const result = await service.listVoiceSessions({
        userId: ctx.user.id,
        page: input?.page,
        pageSize: input?.pageSize,
        search: input?.search,
      })
      return {
        items: result.items.map(mapSessionListItem),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      }
    }),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return service.endVoiceSession({
        userId: ctx.user.id,
        sessionId: input.sessionId,
      })
    }),

  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await service.deleteVoiceSession({
        userId: ctx.user.id,
        sessionId: input.sessionId,
      })
      return { ok }
    }),
})
