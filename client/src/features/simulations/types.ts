export type DifficultyLevel = "adaptive" | "easy" | "medium" | "hard"
export type SessionStatus = "completed" | "in_progress" | "abandoned"

/**
 * How a practice session runs (environment). Catalog only — not wired to runners yet.
 *
 * - `codeRun` — write code, server executes (judge / one-shot run). SWE algorithms, scripts.
 * - `workspace` — live session over WS: editor + filesystem + terminal. Full-stack, pair-coding.
 * - `terminal` — shell-only lab. DevOps / SRE / ops incident tasks.
 * - `conversation` — AI interviewer dialogue (behavioral, product, design, etc.).
 */
export type TrackFormat = "codeRun" | "workspace" | "terminal" | "conversation"

/** Audience buckets used for resume-based track recommendations. */
export type TrackRoleFamily =
  | "engineering"
  | "product"
  | "design"
  | "finance"
  | "consulting"
  | "clinical"
  | "general"

export type DurationBucket = "short" | "medium" | "long"

export interface InterviewTrack {
  readonly id: string
  readonly iconName: string
  readonly difficulty: DifficultyLevel
  /** Rough exercise count in the track (catalog metadata). */
  readonly taskCount: number
  readonly format: TrackFormat
  readonly durationMin: number
  /** Which role families this track is primarily for. */
  readonly roleFamilies: readonly TrackRoleFamily[]
  readonly titleKey: string
  readonly descriptionKey: string
}

export interface RecentSession {
  readonly id: string
  readonly role: string
  readonly track: string
  readonly date: string
  readonly durationMin: number
  readonly score: number | null
  readonly status: SessionStatus
}
