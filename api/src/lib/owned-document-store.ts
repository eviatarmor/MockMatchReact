import { TRPCError } from "@trpc/server"
import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  type Column,
  type SQL,
} from "drizzle-orm"
import type { PgTable } from "drizzle-orm/pg-core"
import type { PaginatedListInput } from "@mockmatch/schemas"
import type { Database } from "../db/client.js"

/**
 * Minimal column surface every user-owned document table must expose.
 * Resume / cover-letter tables implement this shape (extra cols OK).
 */
export interface OwnedDocumentColumns {
  id: Column
  userId: Column
  title: Column
  company: Column
  status: Column
  templateId: Column
  style: Column
  document: Column
  createdAt: Column
  updatedAt: Column
}

export type OwnedDocumentTable = PgTable & OwnedDocumentColumns

export interface ListOwnedDocumentsOptions {
  readonly table: OwnedDocumentTable
  readonly userId: string
  readonly input: PaginatedListInput
  /** Extra columns to ILIKE against (besides title + company). */
  readonly extraSearchColumns?: Column[]
}

export async function listOwnedDocuments(
  db: Database,
  opts: ListOwnedDocumentsOptions
) {
  const { table, userId, input, extraSearchColumns = [] } = opts
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 10
  const offset = (page - 1) * pageSize

  const conditions: SQL[] = [eq(table.userId, userId)]

  const search = input.search?.trim()
  if (search) {
    const pattern = `%${search}%`
    const searchParts = [
      ilike(table.title, pattern),
      ilike(table.company, pattern),
      ...extraSearchColumns.map((col) => ilike(col, pattern)),
    ]
    conditions.push(or(...searchParts)!)
  }

  const where = and(...conditions)

  const [totalRow] = await db
    .select({ value: count() })
    .from(table)
    .where(where)

  const rows = await db
    .select()
    .from(table)
    .where(where)
    .orderBy(desc(table.updatedAt))
    .limit(pageSize)
    .offset(offset)

  return {
    rows: rows as Array<Record<string, unknown>>,
    total: totalRow?.value ?? 0,
    page,
    pageSize,
  }
}

export async function getOwnedDocument(
  db: Database,
  table: OwnedDocumentTable,
  userId: string,
  id: string,
  notFoundMessage: string
) {
  const rows = await db
    .select()
    .from(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)))
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: notFoundMessage })
  }
  return row as Record<string, unknown>
}

export async function deleteOwnedDocument(
  db: Database,
  table: OwnedDocumentTable,
  userId: string,
  id: string,
  notFoundMessage: string
) {
  const deleted = await db
    .delete(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)))
    .returning()

  if (deleted.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: notFoundMessage })
  }

  return { ok: true as const }
}

export function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  return String(value)
}
