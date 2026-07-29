import {
  ideWorkspaceCreateInputSchema,
  ideWorkspaceIdInputSchema,
  ideWorkspaceListInputSchema,
  ideWorkspaceUpdateInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createIdeWorkspace,
  deleteIdeWorkspace,
  duplicateIdeWorkspace,
  getIdeWorkspace,
  listIdeWorkspaces,
  updateIdeWorkspace,
} from "./service.js"

export const ideWorkspacesRouter = router({
  list: protectedProcedure
    .input(ideWorkspaceListInputSchema)
    .query(async ({ ctx, input }) => {
      return listIdeWorkspaces(ctx.db, ctx.user.id, input)
    }),

  get: protectedProcedure
    .input(ideWorkspaceIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getIdeWorkspace(ctx.db, ctx.user.id, input.id)
    }),

  create: protectedProcedure
    .input(ideWorkspaceCreateInputSchema.optional())
    .mutation(async ({ ctx, input }) => {
      return createIdeWorkspace(ctx.db, ctx.user.id, input ?? {})
    }),

  update: protectedProcedure
    .input(ideWorkspaceUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateIdeWorkspace(ctx.db, ctx.user.id, input)
    }),

  duplicate: protectedProcedure
    .input(ideWorkspaceIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return duplicateIdeWorkspace(ctx.db, ctx.user.id, input.id)
    }),

  delete: protectedProcedure
    .input(ideWorkspaceIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteIdeWorkspace(ctx.db, ctx.user.id, input.id)
    }),
})
