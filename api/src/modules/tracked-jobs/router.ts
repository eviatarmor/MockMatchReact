import { TRPCError } from "@trpc/server"
import {
  trackedJobImportLocalInputSchema,
  trackedJobListInputSchema,
  trackedJobRemoveBySourceKeyInputSchema,
  trackedJobRemoveInputSchema,
  trackedJobReplaceStatusesInputSchema,
  trackedJobUpdateStatusInputSchema,
  trackedJobUpsertInputSchema,
} from "@mockmatch/schemas"
import { protectedProcedure, router } from "../../trpc/trpc.js"
import * as service from "./service.js"

export const trackedJobsRouter = router({
  list: protectedProcedure
    .input(trackedJobListInputSchema)
    .query(async ({ ctx, input }) => {
      return service.listTrackedJobs(ctx.db, ctx.user.id, input?.status)
    }),

  upsert: protectedProcedure
    .input(trackedJobUpsertInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Returns { job, questionGen } — clients that only need the job use .job
      return service.upsertTrackedJob(ctx.db, ctx.user.id, input)
    }),

  updateStatus: protectedProcedure
    .input(trackedJobUpdateStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const row = await service.updateTrackedJobStatus(
        ctx.db,
        ctx.user.id,
        input.id,
        input.status
      )
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tracked job not found" })
      }
      return row
    }),

  replaceStatuses: protectedProcedure
    .input(trackedJobReplaceStatusesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const changed = await service.replaceTrackedJobStatuses(
        ctx.db,
        ctx.user.id,
        input.updates
      )
      return { changed }
    }),

  remove: protectedProcedure
    .input(trackedJobRemoveInputSchema)
    .mutation(async ({ ctx, input }) => {
      const ok = await service.removeTrackedJob(ctx.db, ctx.user.id, input.id)
      if (!ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tracked job not found" })
      }
      return { ok: true as const }
    }),

  removeBySourceKey: protectedProcedure
    .input(trackedJobRemoveBySourceKeyInputSchema)
    .mutation(async ({ ctx, input }) => {
      const ok = await service.removeTrackedJobBySourceKey(
        ctx.db,
        ctx.user.id,
        input.sourceKey
      )
      return { ok }
    }),

  importLocal: protectedProcedure
    .input(trackedJobImportLocalInputSchema)
    .mutation(async ({ ctx, input }) => {
      return service.importLocalTrackedJobs(ctx.db, ctx.user.id, input.jobs)
    }),
})
