export type RemoteType = "remote" | "hybrid" | "onsite" | "unknown"

export type SeniorityLevel = "senior" | "lead" | "staff" | "unknown"

export type EmploymentType =
  | "fullTime"
  | "partTime"
  | "contract"
  | "internship"
  | "unknown"

export type MatchTier = "strong" | "good" | "fair" | "weak"

export type DiscoverSortOption = "bestMatch" | "newest" | "salary"

/** Posted-within filter (days). 0 = any. */
export type PostedWithinDays = 0 | 1 | 7 | 30

/** Skill / requirement the job lists (not resume match status). */
export interface JobSkillTag {
  readonly label: string
  /** @deprecated UI ignores match status; kept for API compat. */
  readonly matched?: boolean
}

export interface DiscoverJob {
  readonly id: string
  readonly provider: string
  readonly title: string
  readonly company: string
  readonly avatarText: string
  readonly avatarColorClass: string
  readonly isNew: boolean
  readonly location: string
  readonly remoteType: RemoteType
  readonly salaryRange: string
  readonly salaryMin: number | null
  readonly salaryMax: number | null
  readonly seniority: SeniorityLevel
  readonly employmentType: EmploymentType
  readonly postedAt: string
  /** ISO for sorting / relative formatting. */
  readonly postedAtIso: string
  readonly description: string
  readonly applyUrl: string
  readonly category: string | null
  /** Optional until resume matching lands. */
  readonly matchScore?: number
  readonly matchTier?: MatchTier
  readonly fitNote?: string
  readonly skills?: JobSkillTag[]
  readonly scoreMode?: "heuristic" | "ai"
  readonly scorePending?: boolean
  /** AI / heuristic card blurb for Discover list. */
  readonly summary?: string
  readonly summaryPending?: boolean
}

export type TrackingStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "offer"
  | "declined"

export interface TrackedJob {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly location: string
  readonly avatarText: string
  readonly avatarColorClass: string
  readonly status: TrackingStatus
  readonly nextStep: string
  readonly nextStepDate: string | null
  readonly matchScore: number
  readonly matchTier: MatchTier
  readonly salaryRange: string
  readonly seniority: SeniorityLevel
  readonly postedAt: string
  readonly progressSteps: number
  readonly progressCompleted: number
  readonly activeStepIndex: number | null
  readonly statusUpdatedAt: string
  /** Snapshot fields for full job page when search cache is cold. */
  readonly applyUrl?: string
  readonly description?: string
  readonly provider?: string
}
