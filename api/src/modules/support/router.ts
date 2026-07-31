import {
  submitFeedbackInputSchema,
  submitHelpRequestInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import { submitFeedback, submitHelpRequest } from "./service.js"

export const supportRouter = router({
  submitFeedback: protectedProcedure
    .input(submitFeedbackInputSchema)
    .mutation(async ({ ctx, input }) => {
      return submitFeedback(ctx.user.id, input)
    }),

  submitRequest: protectedProcedure
    .input(submitHelpRequestInputSchema)
    .mutation(async ({ ctx, input }) => {
      return submitHelpRequest(
        { id: ctx.user.id, email: ctx.user.email },
        input
      )
    }),
})
