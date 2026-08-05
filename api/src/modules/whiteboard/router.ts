import {
  whiteboardBoardCreateInputSchema,
  whiteboardBoardIdInputSchema,
  whiteboardBoardUpdateInputSchema,
  whiteboardOpenForQuestionInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createWhiteboardBoard,
  deleteWhiteboardBoard,
  getWhiteboardBoard,
  openWhiteboardForQuestion,
  updateWhiteboardBoard,
} from "./service.js"

export const whiteboardRouter = router({
  get: protectedProcedure
    .input(whiteboardBoardIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getWhiteboardBoard(ctx.db, ctx.user.id, input.id)
    }),

  /** One board per bank question — reopen continues the same canvas. */
  openForQuestion: protectedProcedure
    .input(whiteboardOpenForQuestionInputSchema)
    .mutation(async ({ ctx, input }) => {
      return openWhiteboardForQuestion(ctx.db, ctx.user.id, input)
    }),

  create: protectedProcedure
    .input(whiteboardBoardCreateInputSchema.optional())
    .mutation(async ({ ctx, input }) => {
      return createWhiteboardBoard(ctx.db, ctx.user.id, input ?? {})
    }),

  update: protectedProcedure
    .input(whiteboardBoardUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateWhiteboardBoard(ctx.db, ctx.user.id, input)
    }),

  delete: protectedProcedure
    .input(whiteboardBoardIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteWhiteboardBoard(ctx.db, ctx.user.id, input.id)
    }),
})
