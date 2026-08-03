import { randomUUID } from "node:crypto"
import { TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
import type {
  SpreadsheetWorkbookCreateInput,
  SpreadsheetWorkbookUpdateInput,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import {
  spreadsheetWorkbooks,
  type SpreadsheetDocumentJson,
} from "../../db/schema/spreadsheet-workbooks.js"
import { resolveDocumentAccess } from "../collab/access.js"

const NOT_FOUND = "Spreadsheet not found."

function emptyDocument(): SpreadsheetDocumentJson {
  const id = `sheet-${randomUUID().slice(0, 8)}`
  return {
    version: 1,
    sheets: [
      {
        id,
        name: "Sheet1",
        cells: {},
        rowCount: 100,
        colCount: 26,
      },
    ],
    activeSheetId: id,
  }
}

function toDetail(row: typeof spreadsheetWorkbooks.$inferSelect) {
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

export async function getSpreadsheetWorkbook(
  db: Database,
  userId: string,
  id: string
) {
  await resolveDocumentAccess(db, userId, "spreadsheet", id)
  const rows = await db
    .select()
    .from(spreadsheetWorkbooks)
    .where(eq(spreadsheetWorkbooks.id, id))
    .limit(1)
  const row = rows[0]
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return toDetail(row)
}

export async function createSpreadsheetWorkbook(
  db: Database,
  userId: string,
  input: SpreadsheetWorkbookCreateInput
) {
  const [row] = await db
    .insert(spreadsheetWorkbooks)
    .values({
      userId,
      title: input.title ?? "Untitled spreadsheet",
      status: "active",
      questionId: input.questionId ?? null,
      document:
        (input.document as SpreadsheetDocumentJson | undefined) ??
        emptyDocument(),
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create spreadsheet.",
    })
  }
  return toDetail(row)
}

export async function updateSpreadsheetWorkbook(
  db: Database,
  userId: string,
  input: SpreadsheetWorkbookUpdateInput
) {
  const access = await resolveDocumentAccess(
    db,
    userId,
    "spreadsheet",
    input.id
  )
  if (access.role === "view") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "View-only access cannot save the spreadsheet.",
    })
  }

  const patch: Partial<typeof spreadsheetWorkbooks.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (input.title !== undefined) patch.title = input.title
  if (input.status !== undefined) patch.status = input.status
  if (input.document !== undefined) {
    patch.document = input.document as SpreadsheetDocumentJson
  }

  const [row] = await db
    .update(spreadsheetWorkbooks)
    .set(patch)
    .where(
      and(
        eq(spreadsheetWorkbooks.id, input.id),
        eq(spreadsheetWorkbooks.userId, access.ownerUserId)
      )
    )
    .returning()

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return toDetail(row)
}

export async function deleteSpreadsheetWorkbook(
  db: Database,
  userId: string,
  id: string
) {
  await resolveDocumentAccess(db, userId, "spreadsheet", id)
  const deleted = await db
    .delete(spreadsheetWorkbooks)
    .where(
      and(
        eq(spreadsheetWorkbooks.id, id),
        eq(spreadsheetWorkbooks.userId, userId)
      )
    )
    .returning({ id: spreadsheetWorkbooks.id })
  if (!deleted[0]) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return { ok: true as const }
}
