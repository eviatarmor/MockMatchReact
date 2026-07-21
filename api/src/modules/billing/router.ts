import { createTopUpCheckoutInputSchema } from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createPortalSession,
  createTopUpCheckout,
  getBillingSummary,
  getPacks,
  listInvoices,
} from "./service.js"

export const billingRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    return getBillingSummary(ctx.db, ctx.user.id)
  }),

  listPacks: protectedProcedure.query(() => {
    return getPacks()
  }),

  createTopUpCheckout: protectedProcedure
    .input(createTopUpCheckoutInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createTopUpCheckout(ctx.db, ctx.user.id, input)
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    return createPortalSession(ctx.db, ctx.user.id)
  }),

  listInvoices: protectedProcedure.query(async ({ ctx }) => {
    return listInvoices(ctx.db, ctx.user.id)
  }),
})
