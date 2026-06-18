export type AssessmentDomain =
  | "coding"
  | "caseStudy"
  | "behavioral"
  | "product"
  | "systemDesign"
  | "finance"
  | "clinical"

export type AssessmentDifficulty = "easy" | "medium" | "hard"

export type ExerciseStatus = "notStarted" | "inProgress" | "mastered"

export interface Assessment {
  readonly id: string
  readonly title: string
  readonly domain: AssessmentDomain
  readonly difficulty: AssessmentDifficulty
  readonly durationMin: number
  readonly status: ExerciseStatus
  readonly bestScore: number | null
  readonly iconName: string
}

export interface AssessmentStat {
  readonly id: string
  readonly value: number
  readonly labelKey: string
  readonly iconName: string
}
