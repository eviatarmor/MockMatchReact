export type RemoteType = "remote" | "hybrid" | "onsite"

export type SeniorityLevel = "senior" | "lead" | "staff"

export type EmploymentType = "fullTime" | "partTime" | "contract" | "internship"

export type MatchTier = "strong" | "good" | "fair"

export type DiscoverFilterKey = "remote" | "new"

export interface JobSkillTag {
  readonly label: string
  readonly matched: boolean
}

export interface DiscoverJob {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly avatarText: string
  readonly avatarColorClass: string
  readonly isNew: boolean
  readonly location: string
  readonly remoteType: RemoteType
  readonly salaryRange: string
  readonly seniority: SeniorityLevel
  readonly employmentType: EmploymentType
  readonly postedAt: string
  readonly matchScore: number
  readonly matchTier: MatchTier
  readonly fitNote: string
  readonly skills: JobSkillTag[]
}

export type TrackingStatus = "saved" | "applied" | "interviewing" | "offer"

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
}
