import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import type {
  CoverLetterCreateInput,
  CoverLetterListInput,
  CoverLetterUpdateInput,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import { coverLetters } from "../../db/schema/cover-letters.js"
import {
  deleteOwnedDocument,
  listOwnedDocuments,
  type OwnedDocumentTable,
} from "../../lib/owned-document-store.js"
import { importCoverLetterFromPdf } from "../../lib/document-import.js"
import { resolveDocumentAccess } from "../collab/access.js"
import { canApplyPath } from "../collab/permissions.js"
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
  await resolveDocumentAccess(db, userId, "cover_letter", id)
  const rows = await db
    .select()
    .from(coverLetters)
    .where(eq(coverLetters.id, id))
    .limit(1)
  const row = rows[0]
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return toDetail(row)
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
  const access = await resolveDocumentAccess(
    db,
    userId,
    "cover_letter",
    input.id
  )

  if (access.role === "view") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "View-only access cannot edit this cover letter.",
    })
  }

  const patch: Partial<typeof coverLetters.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.title !== undefined) {
    if (!canApplyPath(access.role, "title")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Cannot edit title." })
    }
    patch.title = input.title
  }
  if (input.document !== undefined) {
    if (!canApplyPath(access.role, "document")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot edit document content.",
      })
    }
    patch.document = input.document
  }
  if (input.templateId !== undefined) {
    if (!canApplyPath(access.role, "templateId")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the owner can change template.",
      })
    }
    patch.templateId = input.templateId
  }
  if (input.style !== undefined) {
    if (!canApplyPath(access.role, "style")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the owner can change style.",
      })
    }
    patch.style = input.style
  }
  if (access.role === "owner") {
    if (input.company !== undefined) patch.company = input.company
    if (input.status !== undefined) patch.status = input.status
  } else if (input.company !== undefined || input.status !== undefined) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the owner can change document metadata.",
    })
  }

  const [row] = await db
    .update(coverLetters)
    .set(patch)
    .where(eq(coverLetters.id, input.id))
    .returning()

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }

  return toDetail(row)
}

/** Create a draft cover letter from a PDF via cheap OpenRouter extraction. */
export async function importCoverLetterFromPdfFile(
  db: Database,
  userId: string,
  input: { filename: string; pdfBase64: string }
) {
  const parsed = await importCoverLetterFromPdf(input)
  return createCoverLetter(db, userId, {
    title: parsed.title,
    company: parsed.company ?? null,
    document: parsed.document,
  })
}

/** Clone a cover letter the user owns into a new draft with a "(Copy)" title. */
export async function duplicateCoverLetter(
  db: Database,
  userId: string,
  id: string
) {
  const source = await getCoverLetter(db, userId, id)
  return createCoverLetter(db, userId, {
    title: withCopySuffix(source.title),
    company: source.company,
    templateId: source.templateId as CoverLetterCreateInput["templateId"],
    style: source.style as CoverLetterCreateInput["style"],
    document: structuredClone(
      source.document
    ) as CoverLetterCreateInput["document"],
  })
}

function withCopySuffix(title: string): string {
  const suffix = " (Copy)"
  const max = 200
  if (title.length + suffix.length <= max) return `${title}${suffix}`
  return `${title.slice(0, max - suffix.length)}${suffix}`
}

export async function deleteCoverLetter(
  db: Database,
  userId: string,
  id: string
) {
  return deleteOwnedDocument(db, table, userId, id, NOT_FOUND)
}
