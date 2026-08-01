import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { users } from "./users.js"

/**
 * Durable voice interview sessions (Pipecat worker handles media).
 * Tickets live in Redis; this row is source of truth for history/transcripts.
 */
export const voiceSessions = pgTable("voice_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  trackId: text("track_id").notNull(),
  sessionKind: text("session_kind").notNull().default("practice"),
  voiceId: text("voice_id").notNull().default("buttery"),
  analyzeFace: boolean("analyze_face").notNull().default(false),
  analyzePosture: boolean("analyze_posture").notNull().default(false),
  /** pending | ready | active | ended | error */
  status: text("status").notNull().default("pending"),
  systemPrompt: text("system_prompt"),
  /** JSON array of { role, text, at } turns (flushed from worker later). */
  transcript: jsonb("transcript").$type<unknown[]>().default([]),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export type VoiceSession = typeof voiceSessions.$inferSelect
export type NewVoiceSession = typeof voiceSessions.$inferInsert
