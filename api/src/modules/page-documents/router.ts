import {
  pageDocumentCreateInputSchema,
  pageDocumentIdInputSchema,
  pageDocumentUpdateInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createPageDocument,
  deletePageDocument,
  getPageDocument,
  updatePageDocument,
} from "./service.js"

export const pageDocumentsRouter = router({
  get: protectedProcedure
    .input(pageDocumentIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getPageDocument(ctx.db, ctx.user.id, input.id)
    }),

  create: protectedProcedure
    .input(pageDocumentCreateInputSchema.optional())
    .mutation(async ({ ctx, input }) => {
      return createPageDocument(ctx.db, ctx.user.id, input ?? {})
    }),

  update: protectedProcedure
    .input(pageDocumentUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updatePageDocument(ctx.db, ctx.user.id, input)
    }),

  delete: protectedProcedure
    .input(pageDocumentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deletePageDocument(ctx.db, ctx.user.id, input.id)
    }),
})
