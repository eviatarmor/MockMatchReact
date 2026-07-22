import {
  documentImportPdfInputSchema,
  resumeCreateInputSchema,
  resumeIdInputSchema,
  resumeListInputSchema,
  resumeUpdateInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createResume,
  deleteResume,
  duplicateResume,
  getResume,
  importResumeFromPdfFile,
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

  /** PDF → structured resume via cheap OpenRouter model. */
  importPdf: protectedProcedure
    .input(documentImportPdfInputSchema)
    .mutation(async ({ ctx, input }) => {
      return importResumeFromPdfFile(ctx.db, ctx.user.id, input)
    }),

  update: protectedProcedure
    .input(resumeUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateResume(ctx.db, ctx.user.id, input)
    }),

  duplicate: protectedProcedure
    .input(resumeIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return duplicateResume(ctx.db, ctx.user.id, input.id)
    }),

  delete: protectedProcedure
    .input(resumeIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteResume(ctx.db, ctx.user.id, input.id)
    }),
})
