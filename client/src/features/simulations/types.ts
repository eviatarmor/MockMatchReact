export type DifficultyLevel = "adaptive" | "easy" | "medium" | "hard"
export type SessionStatus = "completed" | "in_progress" | "abandoned"

/**
 * How a practice session runs (environment). Catalog only — not wired to runners yet.
 *
 * - `codeRun` — write code, client/server executes. SWE algorithms, scripts.
 * - `workspace` — live session over WS: editor + filesystem + terminal.
 * - `terminal` — shell-only lab. DevOps / SRE / ops incident tasks.
 * - `conversation` — AI interviewer dialogue (behavioral, product, design, etc.).
 * - `spreadsheet` — multi-sheet grid + formulas (case / finance tables).
 */
export type TrackFormat =
  | "codeRun"
  | "workspace"
  | "terminal"
  | "conversation"
  | "spreadsheet"

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

/**
 * Recent practice session row (history table).
 * Shape mirrors resume-lab list items for consistent table UX.
 */
export interface RecentSession {
  readonly id: string
  /** Primary title (role / exercise name). */
  readonly title: string
  /** Track or format label (subtitle). */
  readonly track: string
  /** Optional catalog track id for resume navigation. */
  readonly trackId?: string
  /** IDE workspace id when opening an IDE attempt. */
  readonly workspaceId?: string | null
  /** ISO timestamp for relative “Updated” column. */
  readonly updatedAt: string
  readonly durationMin: number
  readonly score: number | null
  readonly status: SessionStatus
  /** Internal: voice | ide (set by list hook). */
  readonly _source?: "voice" | "ide"
  readonly _sourceId?: string
  readonly _workspaceId?: string | null
}
