import {
  resumeCreateInputSchema,
  resumeIdInputSchema,
  resumeListInputSchema,
  resumeUpdateInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createResume,
  deleteResume,
  getResume,
  listResumes,
  updateResume,
} from "./service.js"

export const resumesRouter = router({
  list: protectedProcedure
    .input(resumeListInputSchema)
    .query(async ({ ctx, input }) => {
      return listResumes(ctx.db, ctx.user.id, input)
    }),

  get: protectedProcedure
    .input(resumeIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getResume(ctx.db, ctx.user.id, input.id)
    }),

  create: protectedProcedure
    .input(resumeCreateInputSchema.optional())
    .mutation(async ({ ctx, input }) => {
      return createResume(ctx.db, ctx.user.id, input ?? {})
    }),

  update: protectedProcedure
    .input(resumeUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateResume(ctx.db, ctx.user.id, input)
    }),

  delete: protectedProcedure
    .input(resumeIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteResume(ctx.db, ctx.user.id, input.id)
    }),
})
