export type QuestionDomain =
  | "coding"
  | "systemDesign"
  | "caseStudy"
  | "product"
  | "behavioral"
  | "finance"
  | "clinical"

export type QuestionDifficulty = "easy" | "medium" | "hard"

export type QuestionStatus = "new" | "attempted" | "mastered"

export interface BankQuestion {
  readonly id: string
  readonly title: string
  readonly domain: QuestionDomain
  readonly difficulty: QuestionDifficulty
  readonly company: string | null
  readonly status: QuestionStatus
}

export interface DomainFilter {
  readonly domain: QuestionDomain
  readonly count: number
}

export interface DifficultyFilter {
  readonly difficulty: QuestionDifficulty
  readonly count: number
}

export interface StatusFilter {
  readonly status: QuestionStatus
  readonly count: number
}

export interface CompanyFilter {
  readonly company: string
  readonly count: number
}
