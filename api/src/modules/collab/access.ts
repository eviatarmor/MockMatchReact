import { and, eq, isNull } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type { CollabEffectiveRole, DocumentKind } from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import {
  documentCollaborators,
  documentShares,
} from "../../db/schema/collab.js"
import { coverLetters } from "../../db/schema/cover-letters.js"
import { ideWorkspaces } from "../../db/schema/ide-workspaces.js"
import { resumes } from "../../db/schema/resumes.js"
import { whiteboardBoards } from "../../db/schema/whiteboard-boards.js"
import { isMember } from "../../lib/collab-store.js"
import { hashToken } from "../../lib/crypto.js"

export type DocumentAccess = {
  ownerUserId: string
  role: CollabEffectiveRole
  /** Collaborator row id when role is view|edit */
  collaboratorId?: string
}

async function loadOwnerUserId(
  db: Database,
  kind: DocumentKind,
  documentId: string
): Promise<string | null> {
  if (kind === "resume") {
    const row = await db.query.resumes.findFirst({
      where: eq(resumes.id, documentId),
      columns: { userId: true },
    })
    return row?.userId ?? null
  }
  if (kind === "cover_letter") {
    const row = await db.query.coverLetters.findFirst({
      where: eq(coverLetters.id, documentId),
      columns: { userId: true },
    })
    return row?.userId ?? null
  }
  if (kind === "workspace") {
    const row = await db.query.ideWorkspaces.findFirst({
      where: eq(ideWorkspaces.id, documentId),
      columns: { userId: true },
    })
    return row?.userId ?? null
  }
  if (kind === "whiteboard") {
    const row = await db.query.whiteboardBoards.findFirst({
      where: eq(whiteboardBoards.id, documentId),
      columns: { userId: true },
    })
    return row?.userId ?? null
  }
  return null
}

function notFoundMessage(kind: DocumentKind): string {
  if (kind === "resume") return "Resume not found."
  if (kind === "cover_letter") return "Cover letter not found."
  if (kind === "whiteboard") return "Whiteboard not found."
  return "Workspace not found."
}

/**
 * Resolve access for an authenticated user.
 * Optionally accept a share token to upsert collaborator (first join).
 */
export async function resolveDocumentAccess(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string,
  shareToken?: string
): Promise<DocumentAccess> {
  const ownerUserId = await loadOwnerUserId(db, kind, documentId)
  if (!ownerUserId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: notFoundMessage(kind),
    })
  }

  if (ownerUserId === userId) {
    return { ownerUserId, role: "owner" }
  }

  const existing = await db.query.documentCollaborators.findFirst({
    where: and(
      eq(documentCollaborators.documentKind, kind),
      eq(documentCollaborators.documentId, documentId),
      eq(documentCollaborators.userId, userId)
    ),
  })

  if (existing) {
    return {
      ownerUserId,
      role: existing.role,
      collaboratorId: existing.id,
    }
  }

  if (shareToken) {
    const tokenHash = hashToken(shareToken)
    const share = await db.query.documentShares.findFirst({
      where: and(
        eq(documentShares.tokenHash, tokenHash),
        eq(documentShares.documentKind, kind),
        eq(documentShares.documentId, documentId),
        isNull(documentShares.revokedAt)
      ),
    })

    if (share) {
      // Link only works while the owner is in the live collab room.
      const ownerOnline = await isMember(kind, documentId, ownerUserId)
      if (!ownerOnline) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "This share link is only active while the owner is in the document.",
        })
      }

      // Race-safe: insert, on unique violation re-select
      try {
        const [row] = await db
          .insert(documentCollaborators)
          .values({
            documentKind: kind,
            documentId,
            userId,
            role: share.role,
            shareId: share.id,
          })
          .returning()

        return {
          ownerUserId,
          role: row?.role ?? share.role,
          collaboratorId: row?.id,
        }
      } catch {
        const again = await db.query.documentCollaborators.findFirst({
          where: and(
            eq(documentCollaborators.documentKind, kind),
            eq(documentCollaborators.documentId, documentId),
            eq(documentCollaborators.userId, userId)
          ),
        })
        if (again) {
          return {
            ownerUserId,
            role: again.role,
            collaboratorId: again.id,
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to join document.",
        })
      }
    }
  }

  throw new TRPCError({
    code: "NOT_FOUND",
    message: notFoundMessage(kind),
  })
}

/** Owner-only guard (share admin). */
export async function requireDocumentOwner(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string
): Promise<{ ownerUserId: string }> {
  const access = await resolveDocumentAccess(db, userId, kind, documentId)
  if (access.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the document owner can manage sharing.",
    })
  }
  return { ownerUserId: access.ownerUserId }
}
