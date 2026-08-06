import { randomBytes } from "node:crypto"
import { and, desc, eq, isNull } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type {
  CollabEffectiveRole,
  CollabRole,
  DocumentKind,
} from "@mockmatch/schemas"
import { env } from "../../config/env.js"
import type { Database } from "../../db/client.js"
import {
  documentCollaborators,
  documentShares,
} from "../../db/schema/collab.js"
import { coverLetters } from "../../db/schema/cover-letters.js"
import { ideWorkspaces } from "../../db/schema/ide-workspaces.js"
import { resumes } from "../../db/schema/resumes.js"
import { pageDocuments } from "../../db/schema/page-documents.js"
import { spreadsheetWorkbooks } from "../../db/schema/spreadsheet-workbooks.js"
import { whiteboardBoards } from "../../db/schema/whiteboard-boards.js"
import { users } from "../../db/schema/users.js"
import { hashToken } from "../../lib/crypto.js"
import { signCollabTicket } from "../../lib/jwt.js"
import { publishRoom } from "../../lib/collab-store.js"
import { grantCredits, isPaidUser } from "../billing/credits.js"
import {
  requireDocumentOwner,
  resolveDocumentAccess,
} from "./access.js"
import { permissionsForRole } from "./permissions.js"
import { buildShareUrl, parseWorkspaceQuestionId } from "./share-url.js"

/** Redis control plane for live collab WS (api → ws pods). */
async function publishRoomControl(
  kind: DocumentKind,
  documentId: string,
  message: Record<string, unknown>
): Promise<void> {
  await publishRoom(kind, documentId, {
    ...message,
    // Not a WS pod id — every ws instance must handle this (kick / role).
    _origin: "api",
  })
}

/**
 * Share links are session-bound to the owner being in the collab room:
 * - No fixed clock TTL
 * - Valid while owner holds a seat
 * - Revoked when the owner leaves (reopen does not revive the link)
 */
const SHARE_SENTINEL_EXPIRES = new Date("9999-12-31T23:59:59.000Z")

async function questionIdForDocument(
  db: Database,
  kind: DocumentKind,
  documentId: string
): Promise<string | null> {
  if (kind === "whiteboard") {
    const row = await db.query.whiteboardBoards.findFirst({
      where: eq(whiteboardBoards.id, documentId),
      columns: { questionId: true },
    })
    return row?.questionId ?? null
  }
  if (kind === "spreadsheet") {
    const row = await db.query.spreadsheetWorkbooks.findFirst({
      where: eq(spreadsheetWorkbooks.id, documentId),
      columns: { questionId: true },
    })
    return row?.questionId ?? null
  }
  if (kind === "page") {
    const row = await db.query.pageDocuments.findFirst({
      where: eq(pageDocuments.id, documentId),
      columns: { questionId: true },
    })
    return row?.questionId ?? null
  }
  if (kind === "workspace") {
    const row = await db.query.ideWorkspaces.findFirst({
      where: eq(ideWorkspaces.id, documentId),
      columns: { templateId: true },
    })
    return parseWorkspaceQuestionId(row?.templateId) ?? null
  }
  return null
}

const SHARE_NOT_FOUND = "Share link not found."

/** True when the durable document row for this kind/id still exists. */
async function documentExists(
  db: Database,
  kind: DocumentKind,
  documentId: string
): Promise<boolean> {
  if (kind === "whiteboard") {
    const row = await db.query.whiteboardBoards.findFirst({
      where: eq(whiteboardBoards.id, documentId),
      columns: { id: true },
    })
    return Boolean(row)
  }
  if (kind === "spreadsheet") {
    const row = await db.query.spreadsheetWorkbooks.findFirst({
      where: eq(spreadsheetWorkbooks.id, documentId),
      columns: { id: true },
    })
    return Boolean(row)
  }
  if (kind === "page") {
    const row = await db.query.pageDocuments.findFirst({
      where: eq(pageDocuments.id, documentId),
      columns: { id: true },
    })
    return Boolean(row)
  }
  if (kind === "workspace") {
    const row = await db.query.ideWorkspaces.findFirst({
      where: eq(ideWorkspaces.id, documentId),
      columns: { id: true },
    })
    return Boolean(row)
  }
  if (kind === "resume") {
    const row = await db.query.resumes.findFirst({
      where: eq(resumes.id, documentId),
      columns: { id: true },
    })
    return Boolean(row)
  }
  if (kind === "cover_letter") {
    const row = await db.query.coverLetters.findFirst({
      where: eq(coverLetters.id, documentId),
      columns: { id: true },
    })
    return Boolean(row)
  }
  return false
}

/**
 * Map raw share token → document identity so clients can open
 * `/simulations/:questionId?share=` without embedding the board/workspace id.
 * Does not join the room (owner-online check happens on getAccess / wsTicket).
 *
 * Rejects: missing/revoked token, clock-expired rows, deleted documents,
 * wrong bank question path, wrong surface kind (when expectedKind set).
 */
export async function resolveShareToken(
  db: Database,
  shareToken: string,
  expectedQuestionId?: string,
  expectedKind?: DocumentKind
) {
  const tokenHash = hashToken(shareToken)
  const share = await db.query.documentShares.findFirst({
    where: and(
      eq(documentShares.tokenHash, tokenHash),
      isNull(documentShares.revokedAt)
    ),
  })
  if (!share) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: SHARE_NOT_FOUND,
    })
  }

  // Sentinel expires_at (year 9999) = no clock expiry; real past dates still fail.
  if (share.expiresAt.getTime() < Date.now()) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: SHARE_NOT_FOUND,
    })
  }

  const kind = share.documentKind as DocumentKind
  const documentId = share.documentId

  if (expectedKind && kind !== expectedKind) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: SHARE_NOT_FOUND,
    })
  }

  if (!(await documentExists(db, kind, documentId))) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: SHARE_NOT_FOUND,
    })
  }

  const questionId = await questionIdForDocument(db, kind, documentId)

  // Bank paths pass questionId — require a match (null board question ≠ match).
  if (expectedQuestionId !== undefined) {
    if (!questionId || questionId !== expectedQuestionId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: SHARE_NOT_FOUND,
      })
    }
  }

  return {
    kind,
    documentId,
    role: share.role as CollabRole,
    questionId,
  }
}

export async function getAccess(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string,
  shareToken?: string
) {
  const access = await resolveDocumentAccess(
    db,
    userId,
    kind,
    documentId,
    shareToken
  )
  const paid = await isPaidUser(db, access.ownerUserId)
  const permissions = { ...permissionsForRole(access.role) }
  // Share only if owner AND paid
  if (access.role === "owner" && !paid) {
    permissions.canShare = false
  }

  return {
    role: access.role as CollabEffectiveRole,
    ownerUserId: access.ownerUserId,
    isPaidOwner: paid,
    isOwnerPaid: paid,
    canShare: permissions.canShare,
    permissions,
  }
}

export async function createShareLink(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string,
  role: CollabRole
) {
  await requireDocumentOwner(db, userId, kind, documentId)

  if (!(await isPaidUser(db, userId))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Collaboration sharing requires a paid account with credits.",
    })
  }

  const rawToken = randomBytes(32).toString("base64url")
  const tokenHash = hashToken(rawToken)

  const [row] = await db
    .insert(documentShares)
    .values({
      documentKind: kind,
      documentId,
      ownerUserId: userId,
      tokenHash,
      role,
      // DB column still NOT NULL — sentinel means "no clock expiry"
      expiresAt: SHARE_SENTINEL_EXPIRES,
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create share link.",
    })
  }

  let workspaceFormat = "workspace"
  let questionId: string | null = null

  if (kind === "workspace") {
    const ws = await db.query.ideWorkspaces.findFirst({
      where: eq(ideWorkspaces.id, documentId),
      columns: { templateId: true },
    })
    if (ws?.templateId) {
      workspaceFormat = ws.templateId
      questionId = parseWorkspaceQuestionId(ws.templateId)
    }
  } else if (kind === "whiteboard") {
    const board = await db.query.whiteboardBoards.findFirst({
      where: eq(whiteboardBoards.id, documentId),
      columns: { questionId: true },
    })
    questionId = board?.questionId ?? null
  } else if (kind === "spreadsheet") {
    const book = await db.query.spreadsheetWorkbooks.findFirst({
      where: eq(spreadsheetWorkbooks.id, documentId),
      columns: { questionId: true },
    })
    questionId = book?.questionId ?? null
  } else if (kind === "page") {
    const page = await db.query.pageDocuments.findFirst({
      where: eq(pageDocuments.id, documentId),
      columns: { questionId: true },
    })
    questionId = page?.questionId ?? null
  }

  return {
    shareId: row.id,
    url: buildShareUrl(env.APP_URL, kind, documentId, rawToken, {
      workspaceFormat,
      questionId,
    }),
    role: row.role,
    /** Null — links expire when the owner leaves the room, not by clock. */
    expiresAt: null as string | null,
    /** Raw token shown once — never stored server-side in cleartext. */
    token: rawToken,
  }
}

export async function revokeShareLink(
  db: Database,
  userId: string,
  shareId: string
) {
  const share = await db.query.documentShares.findFirst({
    where: eq(documentShares.id, shareId),
  })
  if (!share || share.ownerUserId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found." })
  }

  await db
    .update(documentShares)
    .set({ revokedAt: new Date() })
    .where(eq(documentShares.id, shareId))

  return { ok: true as const }
}

/**
 * Expire every unrevoked share link for a document.
 * Called when the owner leaves the collab room so reopen cannot reuse links.
 */
export async function revokeAllShareLinksForDocument(
  db: Database,
  kind: DocumentKind,
  documentId: string
): Promise<number> {
  const now = new Date()
  const rows = await db
    .update(documentShares)
    .set({ revokedAt: now })
    .where(
      and(
        eq(documentShares.documentKind, kind),
        eq(documentShares.documentId, documentId),
        isNull(documentShares.revokedAt)
      )
    )
    .returning({ id: documentShares.id })
  return rows.length
}

export async function listActiveShareLinks(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string
) {
  await requireDocumentOwner(db, userId, kind, documentId)
  const rows = await db
    .select({
      id: documentShares.id,
      role: documentShares.role,
      createdAt: documentShares.createdAt,
      revokedAt: documentShares.revokedAt,
    })
    .from(documentShares)
    .where(
      and(
        eq(documentShares.documentKind, kind),
        eq(documentShares.documentId, documentId),
        eq(documentShares.ownerUserId, userId),
        isNull(documentShares.revokedAt)
      )
    )
    .orderBy(desc(documentShares.createdAt))

  return {
    items: rows.map((r) => ({
      id: r.id,
      role: r.role,
      createdAt: r.createdAt.toISOString(),
      /** Always null — session-bound, not clock-bound. */
      expiresAt: null as string | null,
    })),
  }
}

export async function listCollaborators(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string
) {
  await requireDocumentOwner(db, userId, kind, documentId)

  const rows = await db
    .select({
      id: documentCollaborators.id,
      userId: documentCollaborators.userId,
      role: documentCollaborators.role,
      createdAt: documentCollaborators.createdAt,
      email: users.email,
      fullName: users.fullName,
    })
    .from(documentCollaborators)
    .innerJoin(users, eq(users.id, documentCollaborators.userId))
    .where(
      and(
        eq(documentCollaborators.documentKind, kind),
        eq(documentCollaborators.documentId, documentId)
      )
    )
    .orderBy(desc(documentCollaborators.createdAt))

  return {
    items: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      role: r.role,
      email: r.email,
      fullName: r.fullName,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

export async function updateCollaboratorRole(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string,
  targetUserId: string,
  role: CollabRole
) {
  await requireDocumentOwner(db, userId, kind, documentId)

  if (!(await isPaidUser(db, userId))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Collaboration requires a paid account with credits.",
    })
  }

  if (targetUserId === userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot change the owner's role.",
    })
  }

  const [row] = await db
    .update(documentCollaborators)
    .set({ role })
    .where(
      and(
        eq(documentCollaborators.documentKind, kind),
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, targetUserId)
      )
    )
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Collaborator not found.",
    })
  }

  // Live WS still holds ticket role until we push an update.
  await publishRoomControl(kind, documentId, {
    type: "peer.role",
    userId: targetUserId,
    role: row.role,
  })

  return {
    userId: row.userId,
    role: row.role,
  }
}

export async function removeCollaborator(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string,
  targetUserId: string
) {
  await requireDocumentOwner(db, userId, kind, documentId)

  if (targetUserId === userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot remove the owner.",
    })
  }

  const deleted = await db
    .delete(documentCollaborators)
    .where(
      and(
        eq(documentCollaborators.documentKind, kind),
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, targetUserId)
      )
    )
    .returning({ id: documentCollaborators.id })

  if (deleted.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Collaborator not found.",
    })
  }

  // Drop their live socket — DB delete alone leaves an open edit session.
  await publishRoomControl(kind, documentId, {
    type: "peer.kick",
    userId: targetUserId,
    reason: "removed",
  })

  return { ok: true as const, kickedUserId: targetUserId }
}

export async function issueWsTicket(
  db: Database,
  user: { id: string; email: string },
  kind: DocumentKind,
  documentId: string,
  shareToken?: string
) {
  const access = await resolveDocumentAccess(
    db,
    user.id,
    kind,
    documentId,
    shareToken
  )

  const paid = await isPaidUser(db, access.ownerUserId)
  // Non-owners need a paid owner to join multiplayer
  if (access.role !== "owner" && !paid) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This document's owner no longer has collaboration enabled.",
    })
  }

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { fullName: true, email: true },
  })
  const email = profile?.email || user.email
  const displayName =
    profile?.fullName?.trim() || email.split("@")[0] || "Editor"

  const ticket = await signCollabTicket({
    sub: user.id,
    email,
    name: displayName,
    kind,
    documentId,
    role: access.role,
    ownerUserId: access.ownerUserId,
  })
  const wsBase = env.WS_URL.replace(/\/$/, "")

  return {
    ticket,
    wsUrl: `${wsBase}/collab`,
    role: access.role,
    ownerUserId: access.ownerUserId,
    permissions: permissionsForRole(access.role),
    expiresInSeconds: 120,
  }
}

export async function grantDevCreditsForUser(
  db: Database,
  userId: string,
  amount: number
) {
  if (env.NODE_ENV === "production") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Dev credit grants are disabled in production.",
    })
  }
  const bal = await grantCredits(db, userId, amount)
  return {
    total: bal.total,
    used: bal.used,
    remaining: bal.remaining,
  }
}

/** Load durable snapshot fields for Redis seed. */
export async function loadDocumentSnapshot(
  db: Database,
  kind: DocumentKind,
  documentId: string
) {
  if (kind === "resume") {
    const row = await db.query.resumes.findFirst({
      where: eq(resumes.id, documentId),
    })
    if (!row) return null
    return {
      ownerUserId: row.userId,
      title: row.title,
      templateId: row.templateId,
      style: row.style as Record<string, unknown>,
      document: row.document as unknown,
      updatedAt: row.updatedAt.toISOString(),
    }
  }
  if (kind === "cover_letter") {
    const row = await db.query.coverLetters.findFirst({
      where: eq(coverLetters.id, documentId),
    })
    if (!row) return null
    return {
      ownerUserId: row.userId,
      title: row.title,
      templateId: row.templateId,
      style: row.style as Record<string, unknown>,
      document: row.document as unknown,
      updatedAt: row.updatedAt.toISOString(),
    }
  }
  if (kind === "whiteboard") {
    const row = await db.query.whiteboardBoards.findFirst({
      where: eq(whiteboardBoards.id, documentId),
    })
    if (!row) return null
    return {
      ownerUserId: row.userId,
      title: row.title,
      templateId: "whiteboard",
      style: {} as Record<string, unknown>,
      document: row.document as unknown,
      updatedAt: row.updatedAt.toISOString(),
    }
  }
  if (kind === "spreadsheet") {
    const row = await db.query.spreadsheetWorkbooks.findFirst({
      where: eq(spreadsheetWorkbooks.id, documentId),
    })
    if (!row) return null
    return {
      ownerUserId: row.userId,
      title: row.title,
      templateId: "spreadsheet",
      style: {} as Record<string, unknown>,
      document: row.document as unknown,
      updatedAt: row.updatedAt.toISOString(),
    }
  }
  if (kind === "page") {
    const row = await db.query.pageDocuments.findFirst({
      where: eq(pageDocuments.id, documentId),
    })
    if (!row) return null
    return {
      ownerUserId: row.userId,
      title: row.title,
      templateId: "page",
      style: {} as Record<string, unknown>,
      document: row.document as unknown,
      updatedAt: row.updatedAt.toISOString(),
    }
  }
  const row = await db.query.ideWorkspaces.findFirst({
    where: eq(ideWorkspaces.id, documentId),
  })
  if (!row) return null
  return {
    ownerUserId: row.userId,
    title: row.title,
    templateId: row.templateId,
    style: (row.style ?? {}) as Record<string, unknown>,
    document: row.document as unknown,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function persistDocumentSnapshot(
  db: Database,
  kind: DocumentKind,
  documentId: string,
  ownerUserId: string,
  snapshot: {
    title: string
    templateId: string
    style: unknown
    document: unknown
    lastEditorUserId?: string
  }
): Promise<void> {
  // Lazy import avoids circular deps with document services
  const { syncCandidateProfile } = await import("../candidate-profile/sync.js")
  const { maybeRecordDocumentVersion } = await import(
    "../document-versions/service.js"
  )

  if (kind === "resume") {
    await db
      .update(resumes)
      .set({
        title: snapshot.title,
        templateId: snapshot.templateId,
        style: snapshot.style as typeof resumes.$inferInsert.style,
        document: snapshot.document as typeof resumes.$inferInsert.document,
        updatedAt: new Date(),
      })
      .where(and(eq(resumes.id, documentId), eq(resumes.userId, ownerUserId)))
    await syncCandidateProfile(db, ownerUserId)
    await maybeRecordDocumentVersion(db, {
      kind,
      documentId,
      actorUserId: snapshot.lastEditorUserId ?? ownerUserId,
      title: snapshot.title,
      templateId: snapshot.templateId,
      style: snapshot.style,
      document: snapshot.document,
      source: "collab_flush",
    })
    return
  }
  if (kind === "cover_letter") {
    await db
      .update(coverLetters)
      .set({
        title: snapshot.title,
        templateId: snapshot.templateId,
        style: snapshot.style as typeof coverLetters.$inferInsert.style,
        document: snapshot.document as typeof coverLetters.$inferInsert.document,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(coverLetters.id, documentId),
          eq(coverLetters.userId, ownerUserId)
        )
      )
    await syncCandidateProfile(db, ownerUserId)
    await maybeRecordDocumentVersion(db, {
      kind,
      documentId,
      actorUserId: snapshot.lastEditorUserId ?? ownerUserId,
      title: snapshot.title,
      templateId: snapshot.templateId,
      style: snapshot.style,
      document: snapshot.document,
      source: "collab_flush",
    })
    return
  }

  if (kind === "whiteboard") {
    // Reject corrupt CRDT materializations so flush retries instead of wiping.
    const { whiteboardDocumentSchema } = await import("@mockmatch/schemas")
    const parsed = whiteboardDocumentSchema.safeParse(snapshot.document)
    if (!parsed.success) {
      throw new Error(
        `Invalid whiteboard document on collab flush (${documentId}): ${parsed.error.message}`
      )
    }

    const updated = await db
      .update(whiteboardBoards)
      .set({
        title: snapshot.title,
        document: parsed.data as typeof whiteboardBoards.$inferInsert.document,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(whiteboardBoards.id, documentId),
          eq(whiteboardBoards.userId, ownerUserId)
        )
      )
      .returning({ id: whiteboardBoards.id })

    if (!updated[0]) {
      // Avoid markFlushed clearing dirty when the row was missing/mismatched.
      throw new Error(
        `Whiteboard flush missed row ${documentId} (owner ${ownerUserId})`
      )
    }
    return
  }

  if (kind === "spreadsheet") {
    await db
      .update(spreadsheetWorkbooks)
      .set({
        title: snapshot.title,
        document:
          snapshot.document as typeof spreadsheetWorkbooks.$inferInsert.document,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(spreadsheetWorkbooks.id, documentId),
          eq(spreadsheetWorkbooks.userId, ownerUserId)
        )
      )
    await maybeRecordDocumentVersion(db, {
      kind,
      documentId,
      actorUserId: snapshot.lastEditorUserId ?? ownerUserId,
      title: snapshot.title,
      templateId: snapshot.templateId || "spreadsheet",
      style: snapshot.style,
      document: snapshot.document,
      source: "collab_flush",
    })
    return
  }

  if (kind === "page") {
    await db
      .update(pageDocuments)
      .set({
        title: snapshot.title,
        document:
          snapshot.document as typeof pageDocuments.$inferInsert.document,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pageDocuments.id, documentId),
          eq(pageDocuments.userId, ownerUserId)
        )
      )
    await maybeRecordDocumentVersion(db, {
      kind,
      documentId,
      actorUserId: snapshot.lastEditorUserId ?? ownerUserId,
      title: snapshot.title,
      templateId: snapshot.templateId || "page",
      style: snapshot.style,
      document: snapshot.document,
      source: "collab_flush",
    })
    return
  }

  await db
    .update(ideWorkspaces)
    .set({
      title: snapshot.title,
      templateId: snapshot.templateId,
      style: (snapshot.style ?? {}) as typeof ideWorkspaces.$inferInsert.style,
      document:
        snapshot.document as typeof ideWorkspaces.$inferInsert.document,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(ideWorkspaces.id, documentId),
        eq(ideWorkspaces.userId, ownerUserId)
      )
    )
  await maybeRecordDocumentVersion(db, {
    kind,
    documentId,
    actorUserId: snapshot.lastEditorUserId ?? ownerUserId,
    title: snapshot.title,
    templateId: snapshot.templateId,
    style: snapshot.style,
    document: snapshot.document,
    source: "collab_flush",
  })
}
