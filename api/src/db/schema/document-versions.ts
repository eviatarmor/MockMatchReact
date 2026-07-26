import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { documentKindEnum } from "./collab.js"
import { users } from "./users.js"

/** How a version row was created. */
export type DocumentVersionSource =
  | "create"
  | "import"
  | "autosave"
  | "collab_flush"
  | "restore"

export type DocumentVersionStyleJson = Record<string, unknown>

/**
 * Full document snapshots for resume / cover-letter version history.
 * `document_id` is not a cross-table FK — pair with `document_kind`.
 */
export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentKind: documentKindEnum("document_kind").notNull(),
    documentId: uuid("document_id").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Display name at write time (survives user rename / delete). */
    actorName: text("actor_name").notNull(),
    title: text("title").notNull(),
    templateId: text("template_id").notNull(),
    style: jsonb("style").$type<DocumentVersionStyleJson>().notNull(),
    document: jsonb("document").$type<unknown>().notNull(),
    contentHash: text("content_hash").notNull(),
    source: text("source").$type<DocumentVersionSource>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_versions_doc_created_idx").on(
      table.documentKind,
      table.documentId,
      table.createdAt
    ),
  ]
)
