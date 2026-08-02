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

export const whiteboardBoardStatusEnum = pgEnum("whiteboard_board_status", [
  "draft",
  "active",
  "archived",
])

/** Element map document for whiteboard practice / collab. */
export type WhiteboardDocumentJson = {
  version: 1
  elements: Record<string, unknown>
}

export const whiteboardBoards = pgTable(
  "whiteboard_boards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: whiteboardBoardStatusEnum("status").notNull().default("draft"),
    /** Optional bank question this board was started from. */
    questionId: uuid("question_id"),
    document: jsonb("document")
      .$type<WhiteboardDocumentJson>()
      .notNull()
      .default({ version: 1, elements: {} }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("whiteboard_boards_user_id_idx").on(table.userId),
    index("whiteboard_boards_user_updated_idx").on(
      table.userId,
      table.updatedAt
    ),
  ]
)

export type WhiteboardBoardRow = typeof whiteboardBoards.$inferSelect
export type NewWhiteboardBoardRow = typeof whiteboardBoards.$inferInsert
