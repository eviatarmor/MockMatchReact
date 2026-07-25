import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { users } from "./users.js"

export const coverLetterStatusEnum = pgEnum("cover_letter_status", [
  "draft",
  "active",
  "archived",
])

export type CoverLetterStyleJson = {
  accent: string
  typeface: string
  heading: string
  density: string
}

export type CoverLetterDocumentJson = {
  sender: {
    name: string
    title: string
    contacts: Array<{ id: string; iconKey: string; value: string }>
  }
  date: string
  recipient: {
    name?: string
    title?: string
    company: string
    addressLines?: string[]
  }
  blocks: Array<Record<string, unknown>>
}

export const coverLetters = pgTable(
  "cover_letters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    company: text("company"),
    status: coverLetterStatusEnum("status").notNull().default("draft"),
    /** Job-agnostic health score (0–100) from general analysis. */
    generalScore: integer("general_score"),
    templateId: text("template_id").notNull().default("modern"),
    style: jsonb("style").$type<CoverLetterStyleJson>().notNull(),
    document: jsonb("document").$type<CoverLetterDocumentJson>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("cover_letters_user_id_idx").on(table.userId),
    index("cover_letters_user_updated_idx").on(table.userId, table.updatedAt),
  ]
)
