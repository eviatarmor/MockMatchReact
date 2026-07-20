import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { loginSchema } from "@mockmatch/schemas"
import { publicProcedure, protectedProcedure, router } from "../../trpc/trpc.js"

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

/**
 * Auth procedures — stubs only. Wire OTP, JWT issue, and email in a later PR.
 */
export const authRouter = router({
  requestOtp: publicProcedure
    .input(loginSchema)
    .mutation(async () => {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "auth.requestOtp not implemented yet",
      })
    }),

  verifyOtp: publicProcedure
    .input(verifyOtpSchema)
    .mutation(async () => {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "auth.verifyOtp not implemented yet",
      })
    }),

  refresh: publicProcedure.mutation(async () => {
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "auth.refresh not implemented yet",
    })
  }),

  logout: publicProcedure.mutation(async () => {
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "auth.logout not implemented yet",
    })
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
    }
  }),
})
