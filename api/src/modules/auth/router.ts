import { TRPCError } from "@trpc/server"
import {
  requestOtpSchema,
  refreshTokenSchema,
  verifyOtpSchema,
} from "@mockmatch/schemas"
import {
  clearAuthCookies,
  getRefreshTokenFromCookie,
  setAuthCookies,
} from "../../lib/cookies.js"
import { publicProcedure, protectedProcedure, router } from "../../trpc/trpc.js"
import {
  logout,
  logoutAll,
  refreshSession,
  requestOtp,
  verifyOtp,
} from "./service.js"

export const authRouter = router({
  requestOtp: publicProcedure
    .input(requestOtpSchema)
    .mutation(async ({ ctx, input }) => {
      return requestOtp(ctx.db, ctx.bus, input)
    }),

  verifyOtp: publicProcedure
    .input(verifyOtpSchema)
    .mutation(async ({ ctx, input }) => {
      const tokens = await verifyOtp(ctx.db, ctx.bus, input)
      setAuthCookies(ctx.hono, tokens)
      // Tokens live in HttpOnly cookies only — never return them to JS.
      return { user: tokens.user }
    }),

  refresh: publicProcedure
    .input(refreshTokenSchema.optional())
    .mutation(async ({ ctx, input }) => {
      const refreshToken =
        input?.refreshToken ?? getRefreshTokenFromCookie(ctx.hono)
      if (!refreshToken) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No refresh token.",
        })
      }
      const tokens = await refreshSession(ctx.db, refreshToken)
      setAuthCookies(ctx.hono, tokens)
      return { user: tokens.user }
    }),

  logout: publicProcedure
    .input(refreshTokenSchema.optional())
    .mutation(async ({ ctx, input }) => {
      const refreshToken =
        input?.refreshToken ?? getRefreshTokenFromCookie(ctx.hono)
      const result = await logout(ctx.db, refreshToken)
      clearAuthCookies(ctx.hono)
      return result
    }),

  logoutAll: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await logoutAll(ctx.user.id)
    clearAuthCookies(ctx.hono)
    return result
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: (table, { eq }) => eq(table.id, ctx.user.id),
    })

    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." })
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    }
  }),
})
