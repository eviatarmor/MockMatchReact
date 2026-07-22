import {
  coverLetterCreateInputSchema,
  coverLetterIdInputSchema,
  coverLetterListInputSchema,
  coverLetterUpdateInputSchema,
  documentImportPdfInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createCoverLetter,
  deleteCoverLetter,
  duplicateCoverLetter,
  getCoverLetter,
  importCoverLetterFromPdfFile,
  listCoverLetters,
  updateCoverLetter,
} from "./service.js"

export const coverLettersRouter = router({
  list: protectedProcedure
    .input(coverLetterListInputSchema)
    .query(async ({ ctx, input }) => {
      return listCoverLetters(ctx.db, ctx.user.id, input)
    }),

  get: protectedProcedure
    .input(coverLetterIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getCoverLetter(ctx.db, ctx.user.id, input.id)
    }),

  create: protectedProcedure
    .input(coverLetterCreateInputSchema.optional())
    .mutation(async ({ ctx, input }) => {
      return createCoverLetter(ctx.db, ctx.user.id, input ?? {})
    }),

  /** PDF → structured cover letter via cheap OpenRouter model. */
  importPdf: protectedProcedure
    .input(documentImportPdfInputSchema)
    .mutation(async ({ ctx, input }) => {
      return importCoverLetterFromPdfFile(ctx.db, ctx.user.id, input)
    }),

  update: protectedProcedure
    .input(coverLetterUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateCoverLetter(ctx.db, ctx.user.id, input)
    }),

  duplicate: protectedProcedure
    .input(coverLetterIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return duplicateCoverLetter(ctx.db, ctx.user.id, input.id)
    }),

  delete: protectedProcedure
    .input(coverLetterIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteCoverLetter(ctx.db, ctx.user.id, input.id)
    }),
})
