import {
  coverLetterCreateInputSchema,
  coverLetterIdInputSchema,
  coverLetterListInputSchema,
  coverLetterUpdateInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createCoverLetter,
  deleteCoverLetter,
  getCoverLetter,
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

  update: protectedProcedure
    .input(coverLetterUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateCoverLetter(ctx.db, ctx.user.id, input)
    }),

  delete: protectedProcedure
    .input(coverLetterIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteCoverLetter(ctx.db, ctx.user.id, input.id)
    }),
})
