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

export const spreadsheetWorkbookStatusEnum = pgEnum(
  "spreadsheet_workbook_status",
  ["draft", "active", "archived"]
)

/** Sparse multi-sheet workbook JSON (mirrors @mockmatch/spreadsheet document). */
export type SpreadsheetDocumentJson = {
  version: 1
  sheets: Array<{
    id: string
    name: string
    cells: Record<string, { raw: string }>
    rowCount: number
    colCount: number
  }>
  activeSheetId: string
}

export const spreadsheetWorkbooks = pgTable(
  "spreadsheet_workbooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: spreadsheetWorkbookStatusEnum("status").notNull().default("draft"),
    questionId: uuid("question_id"),
    document: jsonb("document")
      .$type<SpreadsheetDocumentJson>()
      .notNull()
      .default({ version: 1, sheets: [], activeSheetId: "" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("spreadsheet_workbooks_user_id_idx").on(table.userId),
    index("spreadsheet_workbooks_user_updated_idx").on(
      table.userId,
      table.updatedAt
    ),
  ]
)

export type SpreadsheetWorkbookRow = typeof spreadsheetWorkbooks.$inferSelect
export type NewSpreadsheetWorkbookRow = typeof spreadsheetWorkbooks.$inferInsert
