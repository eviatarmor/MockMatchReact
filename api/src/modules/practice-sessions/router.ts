import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import * as service from "./service.js"

export const practiceSessionsRouter = router({
  list: protectedProcedure
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
      return service.listPracticeSessions(ctx.db, ctx.user.id, input)
    }),

  openForTrack: protectedProcedure
    .input(z.object({ trackId: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      const session = await service.getOpenPracticeSession(
        ctx.db,
        ctx.user.id,
        input.trackId
      )
      return { session }
    }),

  startNew: protectedProcedure
    .input(
      z.object({
        trackId: z.string().min(1).max(128).optional(),
        questionId: z.string().uuid().optional(),
        abandonOpen: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return service.startNewPracticeSession(ctx.db, ctx.user.id, input)
    }),

  attachWorkspace: protectedProcedure
    .input(
      z.object({
        trackId: z.string().min(1).max(128),
        workspaceId: z.string().uuid(),
        title: z.string().max(200).optional(),
        questionId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return service.attachWorkspaceSession(ctx.db, ctx.user.id, input)
    }),

  complete: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        score: z.number().int().min(0).max(100).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const row = await service.completePracticeSession(
        ctx.db,
        ctx.user.id,
        input.sessionId,
        input.score
      )
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }
      return row
    }),

  abandon: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const row = await service.abandonPracticeSession(
        ctx.db,
        ctx.user.id,
        input.sessionId
      )
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await service.deletePracticeSession(
        ctx.db,
        ctx.user.id,
        input.sessionId
      )
      return { ok }
    }),
})
