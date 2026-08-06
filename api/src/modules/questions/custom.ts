/**
 * Custom question create + self-only deploy.
 * Visibility is hard-locked to `self`; team/global deploy is rejected.
 */
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type {
  CreateCustomQuestionInput,
  CustomQuestionDto,
  DeployQuestionInput,
  QuestionDeployScope,
  QuestionFormat,
  SimulationTypeDto,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import { questions } from "../../db/schema/questions.js"
import {
  buildContentHash,
  buildSearchDocument,
} from "./dedupe.js"
import {
  normalizeCustomQuestionPayload,
  SIMULATION_TYPES,
} from "./custom-payload.js"

function toCustomDto(row: {
  id: string
  title: string
  domain: string
  difficulty: string
  company: string | null
  format: string
  language: string | null
  body: string | null
  payload: unknown
  tags: string[] | null
  roleFamilies: string[] | null
  visibility: string
  status: string
  createdAt: Date
  updatedAt: Date
}): CustomQuestionDto {
  return {
    id: row.id,
    title: row.title,
    domain: row.domain as CustomQuestionDto["domain"],
    difficulty: row.difficulty as CustomQuestionDto["difficulty"],
    company: row.company,
    format: row.format as QuestionFormat,
    language: row.language,
    body: row.body,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    tags: row.tags ?? [],
    roleFamilies: row.roleFamilies ?? [],
    visibility: row.visibility as CustomQuestionDto["visibility"],
    publishStatus: row.status as CustomQuestionDto["publishStatus"],
    isCustom: true,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Load row and ensure caller owns a self-scoped custom question. */
async function requireOwnedCustom(
  db: Database,
  userId: string,
  questionId: string
) {
  const row = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  })
  if (!row || row.status === "archived") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }
  // SEC-003: do not leak existence of another user's custom row
  if (row.ownerUserId !== userId || row.visibility !== "self") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }
  return row
}

/**
 * Create a draft custom question owned by the caller (visibility=self).
 * Does not appear in the shared bank until `deployQuestion` with scope self.
 */
export async function createCustomQuestion(
  db: Database,
  userId: string,
  input: CreateCustomQuestionInput
): Promise<CustomQuestionDto> {
  const normalized = normalizeCustomQuestionPayload({
    format: input.format,
    domain: input.domain,
    body: input.body,
    language: input.language,
    payload: input.payload,
  })

  const contentHash = buildContentHash({
    title: input.title,
    body: normalized.body,
    format: input.format,
    language: normalized.language,
  })
  const searchDocument = buildSearchDocument({
    title: input.title,
    domain: input.domain,
    format: input.format,
    language: normalized.language,
    body: normalized.body,
    tags: input.tags,
  })

  try {
    const [row] = await db
      .insert(questions)
      .values({
        title: input.title,
        body: normalized.body,
        domain: input.domain,
        difficulty: input.difficulty,
        company: input.company ?? null,
        format: input.format,
        payload: normalized.payload,
        language: normalized.language,
        roleFamilies: input.roleFamilies ?? [],
        tags: input.tags ?? [],
        source: "manual",
        ownerUserId: userId,
        visibility: "self",
        contentCache: normalized.contentCache,
        contentVersion: "v1",
        contentPrefix: null,
        searchDocument,
        contentHash,
        status: "draft",
      })
      .returning()

    if (!row) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create custom question",
      })
    }

    // Set content prefix after id is known (matches generate path)
    if (Object.keys(normalized.contentCache).length > 0) {
      const contentPrefix = `questions/${row.id}/v1/`
      const [updated] = await db
        .update(questions)
        .set({ contentPrefix, updatedAt: new Date() })
        .where(eq(questions.id, row.id))
        .returning()
      if (updated) return toCustomDto(updated)
    }

    return toCustomDto(row)
  } catch (err) {
    // Unique (owner, content_hash) collision
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You already have a custom question with the same content",
      })
    }
    throw err
  }
}

/**
 * Deploy a custom question into the caller's personal bank (published + self).
 * Non-self scopes are always rejected — team/global publish is out of scope.
 */
export async function deployQuestion(
  db: Database,
  userId: string,
  input: DeployQuestionInput
): Promise<CustomQuestionDto> {
  const scope: QuestionDeployScope = input.scope ?? "self"
  if (scope !== "self") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Only self deploy is supported. Team and global publish are not available.",
    })
  }

  const row = await requireOwnedCustom(db, userId, input.id)

  if (row.status === "published" && row.visibility === "self") {
    // Idempotent re-deploy
    return toCustomDto(row)
  }

  if (row.status === "archived") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot deploy an archived question",
    })
  }

  const now = new Date()
  const [updated] = await db
    .update(questions)
    .set({
      status: "published",
      visibility: "self",
      ownerUserId: userId,
      updatedAt: now,
    })
    .where(
      and(
        eq(questions.id, input.id),
        eq(questions.ownerUserId, userId),
        eq(questions.visibility, "self")
      )
    )
    .returning()

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }

  return toCustomDto(updated)
}

export type ListMineInput = {
  formats?: QuestionFormat[]
  publishStatuses?: Array<"draft" | "published" | "archived">
  page?: number
  pageSize?: number
}

/** Caller's custom rows (draft + published self), not global bank. */
export async function listMineQuestions(
  db: Database,
  userId: string,
  input: ListMineInput = {}
): Promise<{ items: CustomQuestionDto[]; total: number }> {
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 50
  const offset = (page - 1) * pageSize

  const filters = [
    eq(questions.ownerUserId, userId),
    eq(questions.visibility, "self"),
    sql`${questions.status} <> 'archived'`,
  ]

  if (input.formats && input.formats.length > 0) {
    filters.push(inArray(questions.format, input.formats))
  }
  if (input.publishStatuses && input.publishStatuses.length > 0) {
    filters.push(inArray(questions.status, input.publishStatuses))
  }

  const where = and(...filters)

  const rows = await db
    .select()
    .from(questions)
    .where(where)
    .orderBy(desc(questions.updatedAt))
    .limit(pageSize)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(where)

  return {
    items: rows.map(toCustomDto),
    total: count ?? 0,
  }
}

export function listSimulationTypes(): SimulationTypeDto[] {
  return SIMULATION_TYPES.map((t) => ({
    format: t.format,
    id: t.id,
    createSupported: t.createSupported,
    notes: t.notes,
  }))
}

/**
 * Access rule for bank reads:
 * - global published (no owner): any authenticated user
 * - self: only owner; draft only via listMine / owner paths
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
    // Practice surfaces require deploy first
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
