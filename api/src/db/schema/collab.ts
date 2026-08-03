import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { users } from "./users.js"

/** Collaborator / share-link roles. Owner is never stored here — inferred from document.user_id. */
export const collabRoleEnum = pgEnum("collab_role", ["view", "edit"])

export const documentKindEnum = pgEnum("document_kind", [
  "resume",
  "cover_letter",
  "workspace",
  "whiteboard",
  "spreadsheet",
  "page",
])

/**
 * Session-bound share links. Raw token never stored — only SHA-256 hash.
 * Active while owner is in the collab room; revoked when owner leaves.
 * `expires_at` is a DB sentinel (no clock expiry) — validity = `revoked_at IS NULL`.
 * Role on the link is copied to document_collaborators on first join.
 */
export const documentShares = pgTable(
  "document_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentKind: documentKindEnum("document_kind").notNull(),
    documentId: uuid("document_id").notNull(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    role: collabRoleEnum("role").notNull().default("edit"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("document_shares_token_hash_uidx").on(table.tokenHash),
    index("document_shares_doc_idx").on(table.documentKind, table.documentId),
  ]
)

/** Durable ACL after first successful join via a valid share link. */
export const documentCollaborators = pgTable(
  "document_collaborators",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentKind: documentKindEnum("document_kind").notNull(),
    documentId: uuid("document_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: collabRoleEnum("role").notNull().default("edit"),
    shareId: uuid("share_id").references(() => documentShares.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("document_collaborators_doc_user_uidx").on(
      table.documentKind,
      table.documentId,
      table.userId
    ),
    index("document_collaborators_user_idx").on(table.userId),
  ]
)
