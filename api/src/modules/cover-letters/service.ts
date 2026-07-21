import { TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
import type {
  CoverLetterCreateInput,
  CoverLetterListInput,
  CoverLetterUpdateInput,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import { coverLetters } from "../../db/schema/cover-letters.js"
import {
  deleteOwnedDocument,
  getOwnedDocument,
  listOwnedDocuments,
  type OwnedDocumentTable,
} from "../../lib/owned-document-store.js"
import {
  blankCoverLetterDocument,
  DEFAULT_STYLE,
  DEFAULT_TEMPLATE_ID,
} from "./defaults.js"

const table = coverLetters as unknown as OwnedDocumentTable
const NOT_FOUND = "Cover letter not found."

function toListItem(row: typeof coverLetters.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toDetail(row: typeof coverLetters.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    status: row.status,
    templateId: row.templateId,
    style: row.style,
    document: row.document,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listCoverLetters(
  db: Database,
  userId: string,
  input: CoverLetterListInput
) {
  const result = await listOwnedDocuments(db, { table, userId, input })
  return {
    items: result.rows.map((r) => toListItem(r as typeof coverLetters.$inferSelect)),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  }
}

export async function getCoverLetter(db: Database, userId: string, id: string) {
  const row = await getOwnedDocument(db, table, userId, id, NOT_FOUND)
  return toDetail(row as typeof coverLetters.$inferSelect)
}

export async function createCoverLetter(
  db: Database,
  userId: string,
  input: CoverLetterCreateInput
) {
  const [row] = await db
    .insert(coverLetters)
    .values({
      userId,
      title: input.title ?? "Untitled cover letter",
      company: input.company ?? null,
      status: "draft",
      templateId: input.templateId ?? DEFAULT_TEMPLATE_ID,
      style: input.style ?? DEFAULT_STYLE,
      document: input.document ?? blankCoverLetterDocument(),
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create cover letter.",
    })
  }

  return toDetail(row)
}

export async function updateCoverLetter(
  db: Database,
  userId: string,
  input: CoverLetterUpdateInput
) {
  await getOwnedDocument(db, table, userId, input.id, NOT_FOUND)

  const patch: Partial<typeof coverLetters.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.title !== undefined) patch.title = input.title
  if (input.company !== undefined) patch.company = input.company
  if (input.status !== undefined) patch.status = input.status
  if (input.templateId !== undefined) patch.templateId = input.templateId
  if (input.style !== undefined) patch.style = input.style
  if (input.document !== undefined) patch.document = input.document

  const [row] = await db
    .update(coverLetters)
    .set(patch)
    .where(and(eq(coverLetters.id, input.id), eq(coverLetters.userId, userId)))
    .returning()

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }

  return toDetail(row)
}

export async function deleteCoverLetter(
  db: Database,
  userId: string,
  id: string
) {
  return deleteOwnedDocument(db, table, userId, id, NOT_FOUND)
}
