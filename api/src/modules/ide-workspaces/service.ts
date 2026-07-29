import { TRPCError } from "@trpc/server"
import { and, count, desc, eq, ilike } from "drizzle-orm"
import type {
  IdeWorkspaceCreateInput,
  IdeWorkspaceListInput,
  IdeWorkspaceUpdateInput,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import { ideWorkspaces } from "../../db/schema/ide-workspaces.js"
import { resolveDocumentAccess } from "../collab/access.js"
import { maybeRecordDocumentVersion } from "../document-versions/service.js"
import {
  blankWorkspaceDocument,
  DEFAULT_WORKSPACE_TEMPLATE_ID,
} from "./defaults.js"

const NOT_FOUND = "Workspace not found."

function toListItem(row: typeof ideWorkspaces.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toDetail(row: typeof ideWorkspaces.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    templateId: row.templateId,
    style: row.style,
    document: row.document,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listIdeWorkspaces(
  db: Database,
  userId: string,
  input: IdeWorkspaceListInput
) {
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 10
  const offset = (page - 1) * pageSize

  const conditions = [eq(ideWorkspaces.userId, userId)]
  const search = input.search?.trim()
  if (search) {
    conditions.push(ilike(ideWorkspaces.title, `%${search}%`))
  }
  const where = and(...conditions)

  const [totalRow] = await db
    .select({ value: count() })
    .from(ideWorkspaces)
    .where(where)

  const rows = await db
    .select()
    .from(ideWorkspaces)
    .where(where)
    .orderBy(desc(ideWorkspaces.updatedAt))
    .limit(pageSize)
    .offset(offset)

  return {
    items: rows.map(toListItem),
    total: totalRow?.value ?? 0,
    page,
    pageSize,
  }
}

export async function getIdeWorkspace(
  db: Database,
  userId: string,
  id: string
) {
  await resolveDocumentAccess(db, userId, "workspace", id)
  const rows = await db
    .select()
    .from(ideWorkspaces)
    .where(eq(ideWorkspaces.id, id))
    .limit(1)
  const row = rows[0]
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return toDetail(row)
}

export async function createIdeWorkspace(
  db: Database,
  userId: string,
  input: IdeWorkspaceCreateInput
) {
  const [row] = await db
    .insert(ideWorkspaces)
    .values({
      userId,
      title: input.title ?? "Untitled workspace",
      status: "draft",
      templateId: DEFAULT_WORKSPACE_TEMPLATE_ID,
      style: {},
      document: input.document ?? blankWorkspaceDocument(),
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create workspace.",
    })
  }

  await maybeRecordDocumentVersion(db, {
    kind: "workspace",
    documentId: row.id,
    actorUserId: userId,
    title: row.title,
    templateId: row.templateId,
    style: row.style,
    document: row.document,
    source: "create",
  })

  return toDetail(row)
}

export async function updateIdeWorkspace(
  db: Database,
  userId: string,
  input: IdeWorkspaceUpdateInput
) {
  const access = await resolveDocumentAccess(
    db,
    userId,
    "workspace",
    input.id
  )
  if (access.role === "view") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your role cannot edit this workspace.",
    })
  }
  if (access.role !== "owner" && input.status != null) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the owner can change workspace status.",
    })
  }

  const patch: Partial<typeof ideWorkspaces.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (input.title !== undefined) patch.title = input.title
  if (input.status !== undefined) patch.status = input.status
  if (input.document !== undefined) patch.document = input.document

  const [row] = await db
    .update(ideWorkspaces)
    .set(patch)
    .where(
      and(
        eq(ideWorkspaces.id, input.id),
        eq(ideWorkspaces.userId, access.ownerUserId)
      )
    )
    .returning()

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }

  if (input.document !== undefined || input.title !== undefined) {
    await maybeRecordDocumentVersion(db, {
      kind: "workspace",
      documentId: row.id,
      actorUserId: userId,
      title: row.title,
      templateId: row.templateId,
      style: row.style,
      document: row.document,
      source: "autosave",
    })
  }

  return toDetail(row)
}

export async function deleteIdeWorkspace(
  db: Database,
  userId: string,
  id: string
) {
  const [row] = await db
    .delete(ideWorkspaces)
    .where(and(eq(ideWorkspaces.id, id), eq(ideWorkspaces.userId, userId)))
    .returning({ id: ideWorkspaces.id })

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return { ok: true as const }
}

export async function duplicateIdeWorkspace(
  db: Database,
  userId: string,
  id: string
) {
  const source = await getIdeWorkspace(db, userId, id)
  return createIdeWorkspace(db, userId, {
    title: `${source.title} (copy)`,
    document: source.document,
  })
}
