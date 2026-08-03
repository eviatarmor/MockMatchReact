import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { users } from "./users.js"

export const pageDocumentStatusEnum = pgEnum("page_document_status", [
  "draft",
  "active",
  "archived",
])

/** Freeform Lexical page payload (HTML body). */
export type PageDocumentJson = {
  version: 1
  html: string
}

export const pageDocuments = pgTable(
  "page_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: pageDocumentStatusEnum("status").notNull().default("draft"),
    questionId: uuid("question_id"),
    document: jsonb("document")
      .$type<PageDocumentJson>()
      .notNull()
      .default({ version: 1, html: "" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("page_documents_user_id_idx").on(table.userId),
    index("page_documents_user_updated_idx").on(table.userId, table.updatedAt),
  ]
)

export type PageDocumentRow = typeof pageDocuments.$inferSelect
export type NewPageDocumentRow = typeof pageDocuments.$inferInsert
