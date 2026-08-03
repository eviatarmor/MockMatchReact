import { TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
import type {
  PageDocumentCreateInput,
  PageDocumentUpdateInput,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import {
  pageDocuments,
  type PageDocumentJson,
} from "../../db/schema/page-documents.js"
import { resolveDocumentAccess } from "../collab/access.js"

const NOT_FOUND = "Page not found."

function emptyDocument(): PageDocumentJson {
  return {
    version: 1,
    html: "<h1></h1><p></p>",
  }
}

function toDetail(row: typeof pageDocuments.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    questionId: row.questionId,
    document: row.document,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getPageDocument(
  db: Database,
  userId: string,
  id: string
) {
  await resolveDocumentAccess(db, userId, "page", id)
  const rows = await db
    .select()
    .from(pageDocuments)
    .where(eq(pageDocuments.id, id))
    .limit(1)
  const row = rows[0]
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return toDetail(row)
}

export async function createPageDocument(
  db: Database,
  userId: string,
  input: PageDocumentCreateInput
) {
  const [row] = await db
    .insert(pageDocuments)
    .values({
      userId,
      title: input.title ?? "Untitled page",
      status: "active",
      questionId: input.questionId ?? null,
      document:
        (input.document as PageDocumentJson | undefined) ?? emptyDocument(),
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create page.",
    })
  }
  return toDetail(row)
}

export async function updatePageDocument(
  db: Database,
  userId: string,
  input: PageDocumentUpdateInput
) {
  const access = await resolveDocumentAccess(db, userId, "page", input.id)
  if (access.role === "view") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "View-only access cannot save the page.",
    })
  }

  const patch: Partial<typeof pageDocuments.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (input.title !== undefined) patch.title = input.title
  if (input.status !== undefined) patch.status = input.status
  if (input.document !== undefined) {
    patch.document = input.document as PageDocumentJson
  }

  const [row] = await db
    .update(pageDocuments)
    .set(patch)
    .where(
      and(
        eq(pageDocuments.id, input.id),
        eq(pageDocuments.userId, access.ownerUserId)
      )
    )
    .returning()

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return toDetail(row)
}

export async function deletePageDocument(
  db: Database,
  userId: string,
  id: string
) {
  await resolveDocumentAccess(db, userId, "page", id)
  const deleted = await db
    .delete(pageDocuments)
    .where(and(eq(pageDocuments.id, id), eq(pageDocuments.userId, userId)))
    .returning({ id: pageDocuments.id })
  if (!deleted[0]) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return { ok: true as const }
}
