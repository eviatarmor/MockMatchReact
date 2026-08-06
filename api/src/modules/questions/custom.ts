/**
 * Question bank access helpers for global + residual self-scoped rows.
 * Authoring (create/deploy/listMine) was removed; visibility/owner columns remain.
 */
import { and, eq, isNull, or } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import { questions } from "../../db/schema/questions.js"

/**
 * Access rule for bank reads:
 * - global published (no owner): any authenticated user
 * - self: only owner; drafts blocked on practice paths unless allowDraftForOwner
 * - archived: never
 */
export function assertQuestionReadable(
  row: {
    status: string
    visibility: string
    ownerUserId: string | null
  },
  userId: string | null,
  opts: { allowDraftForOwner?: boolean } = {}
): void {
  if (row.status === "archived") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }

  if (row.visibility === "global" && row.ownerUserId == null) {
    // Shared bank: published + draft generated still openable (existing behavior)
    if (row.status === "archived") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Question not found",
      })
    }
    return
  }

  // Self-scoped
  if (!userId || row.ownerUserId !== userId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }

  if (row.status === "draft" && !opts.allowDraftForOwner) {
    // Practice surfaces require a published self row
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Deploy this custom question before practicing it",
    })
  }
}

/** SQL predicate: published global OR caller's published self customs. */
export function bankListVisibilityFilter(userId: string, customOnly?: boolean) {
  if (customOnly) {
    return and(
      eq(questions.status, "published"),
      eq(questions.visibility, "self"),
      eq(questions.ownerUserId, userId)
    )
  }
  return and(
    eq(questions.status, "published"),
    or(
      and(eq(questions.visibility, "global"), isNull(questions.ownerUserId)),
      and(eq(questions.visibility, "self"), eq(questions.ownerUserId, userId))
    )!
  )
}
