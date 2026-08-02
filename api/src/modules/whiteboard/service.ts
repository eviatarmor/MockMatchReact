import { TRPCError } from "@trpc/server"
import { and, eq } from "drizzle-orm"
import type {
  WhiteboardBoardCreateInput,
  WhiteboardBoardUpdateInput,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import {
  whiteboardBoards,
  type WhiteboardDocumentJson,
} from "../../db/schema/whiteboard-boards.js"
import { resolveDocumentAccess } from "../collab/access.js"

const NOT_FOUND = "Whiteboard not found."

function emptyDocument(): WhiteboardDocumentJson {
  return { version: 1, elements: {} }
}

function toDetail(row: typeof whiteboardBoards.$inferSelect) {
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

export async function getWhiteboardBoard(
  db: Database,
  userId: string,
  id: string
) {
  await resolveDocumentAccess(db, userId, "whiteboard", id)
  const rows = await db
    .select()
    .from(whiteboardBoards)
    .where(eq(whiteboardBoards.id, id))
    .limit(1)
  const row = rows[0]
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return toDetail(row)
}

export async function createWhiteboardBoard(
  db: Database,
  userId: string,
  input: WhiteboardBoardCreateInput
) {
  const [row] = await db
    .insert(whiteboardBoards)
    .values({
      userId,
      title: input.title ?? "Untitled whiteboard",
      status: "active",
      questionId: input.questionId ?? null,
      document: (input.document as WhiteboardDocumentJson | undefined) ??
        emptyDocument(),
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create whiteboard.",
    })
  }
  return toDetail(row)
}

export async function updateWhiteboardBoard(
  db: Database,
  userId: string,
  input: WhiteboardBoardUpdateInput
) {
  const access = await resolveDocumentAccess(
    db,
    userId,
    "whiteboard",
    input.id
  )
  if (access.role === "view") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "View-only access cannot save the board.",
    })
  }

  const patch: Partial<typeof whiteboardBoards.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (input.title !== undefined) patch.title = input.title
  if (input.status !== undefined) patch.status = input.status
  if (input.document !== undefined) {
    patch.document = input.document as WhiteboardDocumentJson
  }

  const [row] = await db
    .update(whiteboardBoards)
    .set(patch)
    .where(
      and(
        eq(whiteboardBoards.id, input.id),
        eq(whiteboardBoards.userId, access.ownerUserId)
      )
    )
    .returning()

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return toDetail(row)
}

export async function deleteWhiteboardBoard(
  db: Database,
  userId: string,
  id: string
) {
  await resolveDocumentAccess(db, userId, "whiteboard", id)
  const deleted = await db
    .delete(whiteboardBoards)
    .where(
      and(eq(whiteboardBoards.id, id), eq(whiteboardBoards.userId, userId))
    )
    .returning({ id: whiteboardBoards.id })
  if (!deleted[0]) {
    throw new TRPCError({ code: "NOT_FOUND", message: NOT_FOUND })
  }
  return { ok: true as const }
}
