import { TRPCError } from "@trpc/server"
import { publicProcedure, router } from "../../trpc/trpc.js"

/**
 * Question bank procedures — stubs.
 * Indexing path: on upsert/delete publish `questions.upserted` / `questions.deleted`
 * → BullMQ `indexing` queue (FTS + embeddings later).
 */
export const questionsRouter = router({
  list: publicProcedure.query(async () => {
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "questions.list not implemented yet",
    })
  }),
})
