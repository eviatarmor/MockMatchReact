import { TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
import type {
  ResumeCreateInput,
  ResumeListInput,
  ResumeUpdateInput,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import { resumes } from "../../db/schema/resumes.js"
import {
  deleteOwnedDocument,
  getOwnedDocument,
  listOwnedDocuments,
  type OwnedDocumentTable,
} from "../../lib/owned-document-store.js"
import { importResumeFromPdf } from "../../lib/document-import.js"
import {
  blankResumeDocument,
  DEFAULT_STYLE,
  DEFAULT_TEMPLATE_ID,
} from "./defaults.js"

const table = resumes as unknown as OwnedDocumentTable
const NOT_FOUND = "Resume not found."

function toListItem(row: typeof resumes.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    targetRole: row.targetRole,
    company: row.company,
    status: row.status,
    atsScore: row.atsScore,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toDetail(row: typeof resumes.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    targetRole: row.targetRole,
    company: row.company,
    status: row.status,
    atsScore: row.atsScore,
    templateId: row.templateId,
    style: row.style,
    document: row.document,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listResumes(
  db: Database,
  userId: string,
  input: ResumeListInput
) {
  const result = await listOwnedDocuments(db, {
    table,
    userId,
    input,
    extraSearchColumns: [resumes.targetRole],
  })
  return {
    items: result.rows.map((r) => toListItem(r as typeof resumes.$inferSelect)),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  }
}

export async function getResume(db: Database, userId: string, id: string) {
  const row = await getOwnedDocument(db, table, userId, id, NOT_FOUND)
  return toDetail(row as typeof resumes.$inferSelect)
}

export async function createResume(
  db: Database,
  userId: string,
  input: ResumeCreateInput
) {
  const [row] = await db
    .insert(resumes)
    .values({
      userId,
      title: input.title ?? "Untitled resume",
      targetRole: input.targetRole ?? null,
      company: input.company ?? null,
      status: "draft",
      templateId: input.templateId ?? DEFAULT_TEMPLATE_ID,
      style: input.style ?? DEFAULT_STYLE,
      document: input.document ?? blankResumeDocument(),
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create resume.",
    })
  }

  return toDetail(row)
}

export async function updateResume(
  db: Database,
  userId: string,
  input: ResumeUpdateInput
) {
  await getOwnedDocument(db, table, userId, input.id, NOT_FOUND)

  const patch: Partial<typeof resumes.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.title !== undefined) patch.title = input.title
  if (input.targetRole !== undefined) patch.targetRole = input.targetRole
  if (input.company !== undefined) patch.company = input.company
  if (input.status !== undefined) patch.status = input.status
  if (input.templateId !== undefined) patch.templateId = input.templateId
  if (input.style !== undefined) patch.style = input.style
  if (input.document !== undefined) patch.document = input.document

  const [row] = await db
    .update(resumes)
    .set(patch)
    .where(and(eq(resumes.id, input.id), eq(resumes.userId, userId)))
    .returning()

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }

  return toDetail(row)
}

export async function deleteResume(db: Database, userId: string, id: string) {
  return deleteOwnedDocument(db, table, userId, id, NOT_FOUND)
}

/** Clone a resume the user owns into a new draft with a "(Copy)" title. */
export async function duplicateResume(db: Database, userId: string, id: string) {
  const source = await getResume(db, userId, id)
  return createResume(db, userId, {
    title: withCopySuffix(source.title),
    targetRole: source.targetRole,
    company: source.company,
    templateId: source.templateId as ResumeCreateInput["templateId"],
    style: source.style as ResumeCreateInput["style"],
    document: structuredClone(source.document) as ResumeCreateInput["document"],
  })
}

function withCopySuffix(title: string): string {
  const suffix = " (Copy)"
  const max = 200
  if (title.length + suffix.length <= max) return `${title}${suffix}`
  return `${title.slice(0, max - suffix.length)}${suffix}`
}

/** Create a draft resume from a PDF via cheap OpenRouter extraction. */
export async function importResumeFromPdfFile(
  db: Database,
  userId: string,
  input: { filename: string; pdfBase64: string }
) {
  const parsed = await importResumeFromPdf(input)
  return createResume(db, userId, {
    title: parsed.title,
    targetRole: parsed.targetRole ?? null,
    document: parsed.document,
  })
}
