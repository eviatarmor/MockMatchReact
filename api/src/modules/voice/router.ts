import { z } from "zod"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import * as service from "./service.js"

const sessionKindSchema = z.enum(["practice", "fullInterview", "freeform"])

export const voiceRouter = router({
  createSession: protectedProcedure
    .input(
      z.object({
        trackId: z.string().min(1).max(128),
        sessionKind: sessionKindSchema.default("practice"),
        voiceId: z.string().min(1).max(64).default("mellow"),
        analyzeFace: z.boolean().default(false),
        analyzePosture: z.boolean().default(false),
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

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return service.endVoiceSession({
        userId: ctx.user.id,
        sessionId: input.sessionId,
      })
    }),
})
