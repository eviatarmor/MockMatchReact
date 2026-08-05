import {
  createShareLinkInputSchema,
  getAccessInputSchema,
  grantDevCreditsInputSchema,
  listCollaboratorsInputSchema,
  collabDocInputSchema,
  removeCollaboratorInputSchema,
  resolveShareInputSchema,
  revokeShareLinkInputSchema,
  updateCollaboratorRoleInputSchema,
  wsTicketInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createShareLink,
  getAccess,
  grantDevCreditsForUser,
  issueWsTicket,
  listActiveShareLinks,
  listCollaborators,
  removeCollaborator,
  resolveShareToken,
  revokeShareLink,
  updateCollaboratorRole,
} from "./service.js"

export const collabRouter = router({
  getAccess: protectedProcedure
    .input(getAccessInputSchema)
    .query(async ({ ctx, input }) => {
      return getAccess(
        ctx.db,
        ctx.user.id,
        input.kind,
        input.id,
        input.shareToken
      )
    }),

  /** Token → document id (bank share URLs only carry `?share=`). */
  resolveShare: protectedProcedure
    .input(resolveShareInputSchema)
    .query(async ({ ctx, input }) => {
      return resolveShareToken(ctx.db, input.shareToken, input.questionId)
    }),

  createShareLink: protectedProcedure
    .input(createShareLinkInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createShareLink(
        ctx.db,
        ctx.user.id,
        input.kind,
        input.id,
        input.role
      )
    }),

  revokeShareLink: protectedProcedure
    .input(revokeShareLinkInputSchema)
    .mutation(async ({ ctx, input }) => {
      return revokeShareLink(ctx.db, ctx.user.id, input.shareId)
    }),

  listShareLinks: protectedProcedure
    .input(collabDocInputSchema)
    .query(async ({ ctx, input }) => {
      return listActiveShareLinks(ctx.db, ctx.user.id, input.kind, input.id)
    }),

  listCollaborators: protectedProcedure
    .input(listCollaboratorsInputSchema)
    .query(async ({ ctx, input }) => {
      return listCollaborators(ctx.db, ctx.user.id, input.kind, input.id)
    }),

  updateCollaboratorRole: protectedProcedure
    .input(updateCollaboratorRoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateCollaboratorRole(
        ctx.db,
        ctx.user.id,
        input.kind,
        input.id,
        input.userId,
        input.role
      )
    }),

  removeCollaborator: protectedProcedure
    .input(removeCollaboratorInputSchema)
    .mutation(async ({ ctx, input }) => {
      return removeCollaborator(
        ctx.db,
        ctx.user.id,
        input.kind,
        input.id,
        input.userId
      )
    }),

  wsTicket: protectedProcedure
    .input(wsTicketInputSchema)
    .mutation(async ({ ctx, input }) => {
      return issueWsTicket(
        ctx.db,
        { id: ctx.user.id, email: ctx.user.email },
        input.kind,
        input.id,
        input.shareToken
      )
    }),

  /** Non-production only — grant credits so paid collab can be tested. */
  grantDevCredits: protectedProcedure
    .input(grantDevCreditsInputSchema.optional())
    .mutation(async ({ ctx, input }) => {
      return grantDevCreditsForUser(ctx.db, ctx.user.id, input?.amount ?? 100)
    }),
})
