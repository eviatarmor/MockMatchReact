export type DifficultyLevel = "adaptive" | "easy" | "medium" | "hard"
export type SessionStatus = "completed" | "in_progress" | "abandoned"
export type TrackMetaKind = "questions" | "problems" | "prompt" | "cases"

export interface InterviewTrack {
  readonly id: string
  readonly iconName: string
  readonly difficulty: DifficultyLevel
  readonly metaCount: number
  readonly metaKind: TrackMetaKind
  readonly durationMin: number
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
