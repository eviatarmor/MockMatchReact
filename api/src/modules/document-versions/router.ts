import {
  documentVersionGetInputSchema,
  documentVersionRestoreInputSchema,
  documentVersionsListInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  getDocumentVersion,
  listDocumentVersions,
  restoreDocumentVersion,
} from "./service.js"

export const documentVersionsRouter = router({
  list: protectedProcedure
    .input(documentVersionsListInputSchema)
    .query(async ({ ctx, input }) => {
      return listDocumentVersions(ctx.db, ctx.user.id, input.kind, input.id)
    }),

  get: protectedProcedure
    .input(documentVersionGetInputSchema)
    .query(async ({ ctx, input }) => {
      return getDocumentVersion(
        ctx.db,
        ctx.user.id,
        input.kind,
        input.id,
        input.versionId
      )
    }),

  restore: protectedProcedure
    .input(documentVersionRestoreInputSchema)
    .mutation(async ({ ctx, input }) => {
      return restoreDocumentVersion(
        ctx.db,
        ctx.user.id,
        input.kind,
        input.id,
        input.versionId
      )
    }),
})
