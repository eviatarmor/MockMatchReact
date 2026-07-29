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

export const ideWorkspaceStatusEnum = pgEnum("ide_workspace_status", [
  "draft",
  "active",
  "archived",
])

/** File tree + buffer map for collab IDE workspaces. */
export type IdeWorkspaceDocumentJson = {
  tree: Array<{
    id: string
    name: string
    children?: IdeWorkspaceDocumentJson["tree"]
  }>
  files: Record<string, { language?: string; content: string }>
}

export const ideWorkspaces = pgTable(
  "ide_workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: ideWorkspaceStatusEnum("status").notNull().default("draft"),
    /** Reserved collab snapshot field — keep shape aligned with resume/cover letter. */
    templateId: text("template_id").notNull().default("workspace"),
    style: jsonb("style")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    document: jsonb("document").$type<IdeWorkspaceDocumentJson>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ide_workspaces_user_id_idx").on(table.userId),
    index("ide_workspaces_user_updated_idx").on(
      table.userId,
      table.updatedAt
    ),
  ]
)
