import {
  spreadsheetWorkbookCreateInputSchema,
  spreadsheetWorkbookIdInputSchema,
  spreadsheetWorkbookUpdateInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import {
  createSpreadsheetWorkbook,
  deleteSpreadsheetWorkbook,
  getSpreadsheetWorkbook,
  updateSpreadsheetWorkbook,
} from "./service.js"

export const spreadsheetRouter = router({
  get: protectedProcedure
    .input(spreadsheetWorkbookIdInputSchema)
    .query(async ({ ctx, input }) => {
      return getSpreadsheetWorkbook(ctx.db, ctx.user.id, input.id)
    }),

  create: protectedProcedure
    .input(spreadsheetWorkbookCreateInputSchema.optional())
    .mutation(async ({ ctx, input }) => {
      return createSpreadsheetWorkbook(ctx.db, ctx.user.id, input ?? {})
    }),

  update: protectedProcedure
    .input(spreadsheetWorkbookUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateSpreadsheetWorkbook(ctx.db, ctx.user.id, input)
    }),

  delete: protectedProcedure
    .input(spreadsheetWorkbookIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteSpreadsheetWorkbook(ctx.db, ctx.user.id, input.id)
    }),
})
