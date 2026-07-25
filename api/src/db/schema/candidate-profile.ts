import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { users } from "./users.js"
import type { ResumeStyleJson } from "./resumes.js"

/** Heuristic writing-style fingerprint (no LLM). */
export type WritingStyleJson = {
  avgSentenceLen: number
  avgBulletLen: number
  firstPersonRate: number
  actionVerbRate: number
  quantifierRate: number
  tensePreference: "past" | "present" | "mixed"
  formality: "concise" | "narrative" | "mixed"
  samplePhrases: string[]
  toneNotes: string
}

export const DEFAULT_WRITING_STYLE: WritingStyleJson = {
  avgSentenceLen: 14,
  avgBulletLen: 90,
  firstPersonRate: 0,
  actionVerbRate: 0.4,
  quantifierRate: 0.2,
  tensePreference: "past",
  formality: "concise",
  samplePhrases: [],
  toneNotes: "concise bullets",
}

export const candidateProfiles = pgTable("candidate_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  writingStyle: jsonb("writing_style")
    .$type<WritingStyleJson>()
    .notNull()
    .default(DEFAULT_WRITING_STYLE),
  preferredStyle: jsonb("preferred_style").$type<ResumeStyleJson | null>(),
  preferredTemplateId: text("preferred_template_id"),
  compactText: text("compact_text").notNull().default(""),
  profileHash: text("profile_hash").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const candidateSkills = pgTable(
  "candidate_skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    labelNorm: text("label_norm").notNull(),
    source: text("source").notNull().default("resume"),
    timesSeen: integer("times_seen").notNull().default(1),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("candidate_skills_user_norm_uidx").on(
      table.userId,
      table.labelNorm
    ),
    index("candidate_skills_user_idx").on(table.userId),
  ]
)

export const candidateExperience = pgTable(
  "candidate_experience",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    org: text("org").notNull().default(""),
    location: text("location").notNull().default(""),
    startDate: text("start_date").notNull().default(""),
    endDate: text("end_date").notNull().default(""),
    bullets: jsonb("bullets").$type<string[]>().notNull().default([]),
    sourceResumeId: uuid("source_resume_id"),
    fingerprint: text("fingerprint").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("candidate_experience_user_fp_uidx").on(
      table.userId,
      table.fingerprint
    ),
    index("candidate_experience_user_idx").on(table.userId),
  ]
)
