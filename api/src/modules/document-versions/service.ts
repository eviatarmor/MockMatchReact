import { createHash } from "node:crypto"
import { and, asc, count, desc, eq, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type {
  DocumentKind,
  DocumentVersionSource,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import { coverLetters } from "../../db/schema/cover-letters.js"
import {
  documentVersions,
  type DocumentVersionSource as SchemaSource,
} from "../../db/schema/document-versions.js"
import { ideWorkspaces } from "../../db/schema/ide-workspaces.js"
import { resumes } from "../../db/schema/resumes.js"
import { users } from "../../db/schema/users.js"
import { resolveDocumentAccess } from "../collab/access.js"
import { canApplyPath } from "../collab/permissions.js"
import { syncCandidateProfile } from "../candidate-profile/sync.js"

/** Coalesce continuous typing from the same actor into one timeline row. */
const COALESCE_MS = 60_000
/** Hard cap per document — prune oldest after insert/overwrite. */
const MAX_VERSIONS_PER_DOC = 50

export type VersionSnapshotInput = {
  readonly kind: DocumentKind
  readonly documentId: string
  readonly actorUserId: string
  readonly title: string
  readonly templateId: string
  readonly style: unknown
  readonly document: unknown
  readonly source: DocumentVersionSource
  /** Skip coalesce / same-hash short-circuit (create, restore, import). */
  readonly force?: boolean
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`
}

export function contentHash(input: {
  title: string
  templateId: string
  style: unknown
  document: unknown
}): string {
  const payload = stableStringify({
    title: input.title,
    templateId: input.templateId,
    style: input.style,
    document: input.document,
  })
  return createHash("sha256").update(payload).digest("hex")
}

async function resolveActorName(
  db: Database,
  userId: string
): Promise<string> {
  const rows = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const row = rows[0]
  if (!row) return "Unknown"
  const name = row.fullName?.trim()
  if (name) return name
  return row.email
}

async function pruneOldVersions(
  db: Database,
  kind: DocumentKind,
  documentId: string
): Promise<void> {
  // Keep newest MAX; delete anything older than the Nth row.
  const cutoff = await db
    .select({ createdAt: documentVersions.createdAt })
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.documentKind, kind),
        eq(documentVersions.documentId, documentId)
      )
    )
    .orderBy(desc(documentVersions.createdAt))
    .offset(MAX_VERSIONS_PER_DOC - 1)
    .limit(1)

  const edge = cutoff[0]
  if (!edge) return

  await db
    .delete(documentVersions)
    .where(
      and(
        eq(documentVersions.documentKind, kind),
        eq(documentVersions.documentId, documentId),
        sql`${documentVersions.createdAt} < ${edge.createdAt}`
      )
    )
}

/**
 * Record a version when content changes. Coalesces same-actor edits within
 * COALESCE_MS by overwriting the latest row so the timeline stays readable.
 */
export async function maybeRecordDocumentVersion(
  db: Database,
  input: VersionSnapshotInput
): Promise<void> {
  const hash = contentHash({
    title: input.title,
    templateId: input.templateId,
    style: input.style,
    document: input.document,
  })

  const latestRows = await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.documentKind, input.kind),
        eq(documentVersions.documentId, input.documentId)
      )
    )
    .orderBy(desc(documentVersions.createdAt))
    .limit(1)

  const latest = latestRows[0]
  if (!input.force && latest && latest.contentHash === hash) {
    return
  }

  const actorName = await resolveActorName(db, input.actorUserId)
  const now = new Date()
  const source = input.source as SchemaSource

  // Coalesce against the version's original createdAt — do NOT bump createdAt
  // on overwrite or continuous typing resets the window forever (one row only).
  const canCoalesce =
    !input.force &&
    latest &&
    latest.actorUserId === input.actorUserId &&
    now.getTime() - latest.createdAt.getTime() < COALESCE_MS

  if (canCoalesce && latest) {
    await db
      .update(documentVersions)
      .set({
        actorName,
        title: input.title,
        templateId: input.templateId,
        style: input.style as Record<string, unknown>,
        document: input.document,
        contentHash: hash,
        source,
      })
      .where(eq(documentVersions.id, latest.id))
    return
  }

  await db.insert(documentVersions).values({
    documentKind: input.kind,
    documentId: input.documentId,
    actorUserId: input.actorUserId,
    actorName,
    title: input.title,
    templateId: input.templateId,
    style: input.style as Record<string, unknown>,
    document: input.document,
    contentHash: hash,
    source,
    createdAt: now,
  })

  await pruneOldVersions(db, input.kind, input.documentId)
}

function toListItem(row: typeof documentVersions.$inferSelect) {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    actorUserId: row.actorUserId,
    actorName: row.actorName,
    source: row.source as DocumentVersionSource,
    title: row.title,
  }
}

function toDetail(
  row: typeof documentVersions.$inferSelect,
  previous: typeof documentVersions.$inferSelect | null
) {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    actorUserId: row.actorUserId,
    actorName: row.actorName,
    source: row.source as DocumentVersionSource,
    title: row.title,
    templateId: row.templateId,
    style: row.style,
    document: row.document,
    previous: previous
      ? {
          id: previous.id,
          createdAt: previous.createdAt.toISOString(),
          actorUserId: previous.actorUserId,
          actorName: previous.actorName,
          source: previous.source as DocumentVersionSource,
          title: previous.title,
          templateId: previous.templateId,
          style: previous.style,
          document: previous.document,
        }
      : null,
  }
}

export async function listDocumentVersions(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string,
  opts?: { page?: number; pageSize?: number }
) {
  await resolveDocumentAccess(db, userId, kind, documentId)

  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 15
  const offset = (page - 1) * pageSize

  const where = and(
    eq(documentVersions.documentKind, kind),
    eq(documentVersions.documentId, documentId)
  )

  const [totalRow] = await db
    .select({ value: count() })
    .from(documentVersions)
    .where(where)

  const rows = await db
    .select()
    .from(documentVersions)
    .where(where)
    .orderBy(desc(documentVersions.createdAt))
    .limit(pageSize)
    .offset(offset)

  return {
    items: rows.map(toListItem),
    total: totalRow?.value ?? 0,
    page,
    pageSize,
  }
}

export async function getDocumentVersion(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string,
  versionId: string
) {
  await resolveDocumentAccess(db, userId, kind, documentId)

  const rows = await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.id, versionId),
        eq(documentVersions.documentKind, kind),
        eq(documentVersions.documentId, documentId)
      )
    )
    .limit(1)

  const row = rows[0]
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Version not found." })
  }

  // Previous = next-older by created_at (timeline is newest-first in list).
  const older = await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.documentKind, kind),
        eq(documentVersions.documentId, documentId),
        sql`${documentVersions.createdAt} < ${row.createdAt}`
      )
    )
    .orderBy(desc(documentVersions.createdAt))
    .limit(1)

  return toDetail(row, older[0] ?? null)
}

export async function restoreDocumentVersion(
  db: Database,
  userId: string,
  kind: DocumentKind,
  documentId: string,
  versionId: string
) {
  const access = await resolveDocumentAccess(db, userId, kind, documentId)

  if (access.role === "view") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "View-only access cannot restore versions.",
    })
  }

  const rows = await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.id, versionId),
        eq(documentVersions.documentKind, kind),
        eq(documentVersions.documentId, documentId)
      )
    )
    .limit(1)

  const version = rows[0]
  if (!version) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Version not found." })
  }

  const canDesign =
    canApplyPath(access.role, "templateId") &&
    canApplyPath(access.role, "style")
  const canTitle = canApplyPath(access.role, "title")
  const canDocument = canApplyPath(access.role, "document")

  if (!canDocument && !canTitle && !canDesign) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot restore this document.",
    })
  }

  if (kind === "resume") {
    const current = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, documentId))
      .limit(1)
    const cur = current[0]
    if (!cur) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found." })
    }

    const patch: Partial<typeof resumes.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (canTitle) patch.title = version.title
    if (canDocument) {
      patch.document = version.document as typeof resumes.$inferInsert.document
    }
    if (canDesign) {
      patch.templateId = version.templateId
      patch.style = version.style as typeof resumes.$inferInsert.style
    }

    const [row] = await db
      .update(resumes)
      .set(patch)
      .where(eq(resumes.id, documentId))
      .returning()

    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found." })
    }

    await maybeRecordDocumentVersion(db, {
      kind,
      documentId,
      actorUserId: userId,
      title: row.title,
      templateId: row.templateId,
      style: row.style,
      document: row.document,
      source: "restore",
      force: true,
    })

    if (canDocument || canDesign) {
      await syncCandidateProfile(db, row.userId)
    }

    return {
      id: row.id,
      title: row.title,
      templateId: row.templateId,
      style: row.style,
      document: row.document,
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  if (kind === "cover_letter") {
    const current = await db
      .select()
      .from(coverLetters)
      .where(eq(coverLetters.id, documentId))
      .limit(1)
    const cur = current[0]
    if (!cur) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cover letter not found.",
      })
    }

    const patch: Partial<typeof coverLetters.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (canTitle) patch.title = version.title
    if (canDocument) {
      patch.document =
        version.document as typeof coverLetters.$inferInsert.document
    }
    if (canDesign) {
      patch.templateId = version.templateId
      patch.style = version.style as typeof coverLetters.$inferInsert.style
    }

    const [row] = await db
      .update(coverLetters)
      .set(patch)
      .where(eq(coverLetters.id, documentId))
      .returning()

    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Cover letter not found.",
      })
    }

    await maybeRecordDocumentVersion(db, {
      kind,
      documentId,
      actorUserId: userId,
      title: row.title,
      templateId: row.templateId,
      style: row.style,
      document: row.document,
      source: "restore",
      force: true,
    })

    if (canDocument || canDesign) {
      await syncCandidateProfile(db, row.userId)
    }

    return {
      id: row.id,
      title: row.title,
      templateId: row.templateId,
      style: row.style,
      document: row.document,
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  const current = await db
    .select()
    .from(ideWorkspaces)
    .where(eq(ideWorkspaces.id, documentId))
    .limit(1)
  const cur = current[0]
  if (!cur) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Workspace not found.",
    })
  }

  const patch: Partial<typeof ideWorkspaces.$inferInsert> = {
    updatedAt: new Date(),
  }
  if (canTitle) patch.title = version.title
  if (canDocument) {
    patch.document =
      version.document as typeof ideWorkspaces.$inferInsert.document
  }
  if (canDesign) {
    patch.templateId = version.templateId
    patch.style = (version.style ??
      {}) as typeof ideWorkspaces.$inferInsert.style
  }

  const [row] = await db
    .update(ideWorkspaces)
    .set(patch)
    .where(eq(ideWorkspaces.id, documentId))
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Workspace not found.",
    })
  }

  await maybeRecordDocumentVersion(db, {
    kind,
    documentId,
    actorUserId: userId,
    title: row.title,
    templateId: row.templateId,
    style: row.style,
    document: row.document,
    source: "restore",
    force: true,
  })

  return {
    id: row.id,
    title: row.title,
    templateId: row.templateId,
    style: row.style,
    document: row.document,
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Used only for tests / debugging — load ascending for hash checks. */
export async function listVersionsAscending(
  db: Database,
  kind: DocumentKind,
  documentId: string
) {
  return db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.documentKind, kind),
        eq(documentVersions.documentId, documentId)
      )
    )
    .orderBy(asc(documentVersions.createdAt))
}
