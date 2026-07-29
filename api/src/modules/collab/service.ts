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
import { resumes } from "../../db/schema/resumes.js"
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

function shareUrl(kind: DocumentKind, documentId: string, rawToken: string): string {
  const path =
    kind === "resume" ? `/resumes/${documentId}` : `/cover-letters/${documentId}`
  const url = new URL(path, env.APP_URL)
  url.searchParams.set("share", rawToken)
  return url.toString()
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

  return {
    shareId: row.id,
    url: shareUrl(kind, documentId, rawToken),
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
}
