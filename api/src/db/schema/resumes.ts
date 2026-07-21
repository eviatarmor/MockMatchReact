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

export const resumeStatusEnum = pgEnum("resume_status", [
  "draft",
  "active",
  "archived",
])

/** Visual style axes — matches client DocumentStyle / documentStyleSchema. */
export type ResumeStyleJson = {
  accent: string
  typeface: string
  heading: string
  density: string
}

/** Full resume document blob — matches resumeDocumentSchema. */
export type ResumeDocumentJson = {
  header: {
    name: string
    headline: string
    contacts: Array<{ id: string; iconKey: string; value: string }>
  }
  sections: Array<Record<string, unknown>>
}

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    targetRole: text("target_role"),
    company: text("company"),
    status: resumeStatusEnum("status").notNull().default("draft"),
    atsScore: integer("ats_score"),
    templateId: text("template_id").notNull().default("modern"),
    style: jsonb("style").$type<ResumeStyleJson>().notNull(),
    document: jsonb("document").$type<ResumeDocumentJson>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("resumes_user_id_idx").on(table.userId),
    index("resumes_user_updated_idx").on(table.userId, table.updatedAt),
  ]
)
