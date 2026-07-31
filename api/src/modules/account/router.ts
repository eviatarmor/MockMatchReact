import {
  confirmAvatarUploadInputSchema,
  requestAvatarUploadInputSchema,
  updatePreferencesInputSchema,
  updateProfileInputSchema,
} from "@mockmatch/schemas"
import { clearAuthCookies } from "../../lib/cookies.js"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  clearInterviewHistory,
  confirmAvatarUpload,
  deleteAccount,
  getAccount,
  removeAvatar,
  requestAvatarUpload,
  requestDataExport,
  updatePreferences,
  updateProfile,
} from "./service.js"

export const accountRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getAccount(ctx.db, ctx.user.id)
  }),

  updateProfile: protectedProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateProfile(ctx.db, ctx.user.id, input)
    }),

  updatePreferences: protectedProcedure
    .input(updatePreferencesInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updatePreferences(ctx.db, ctx.user.id, input)
    }),

  requestAvatarUpload: protectedProcedure
    .input(requestAvatarUploadInputSchema)
    .mutation(async ({ ctx, input }) => {
      return requestAvatarUpload(ctx.user.id, input)
    }),

  confirmAvatarUpload: protectedProcedure
    .input(confirmAvatarUploadInputSchema)
    .mutation(async ({ ctx, input }) => {
      return confirmAvatarUpload(ctx.db, ctx.user.id, input)
    }),

  removeAvatar: protectedProcedure.mutation(async ({ ctx }) => {
    return removeAvatar(ctx.db, ctx.user.id)
  }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await deleteAccount(ctx.db, ctx.user.id)
    clearAuthCookies(ctx.hono)
    return result
  }),

  requestDataExport: protectedProcedure.mutation(async ({ ctx }) => {
    return requestDataExport(ctx.db, ctx.user.id)
  }),

  clearInterviewHistory: protectedProcedure.mutation(async ({ ctx }) => {
    return clearInterviewHistory(ctx.db, ctx.user.id)
  }),
})
