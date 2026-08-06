export type QuestionDomain =
  | "coding"
  | "systemDesign"
  | "caseStudy"
  | "product"
  | "behavioral"
  | "finance"
  | "clinical"
  | "dataScience"
  | "ml"
  | "security"
  | "devops"
  | "design"
  | "consulting"
  | "marketing"
  | "sales"

export type QuestionDifficulty = "easy" | "medium" | "hard"

export type QuestionStatus = "new" | "attempted" | "mastered"

export type QuestionFormat =
  | "conversation"
  | "code_run"
  | "workspace"
  | "terminal"
  | "whiteboard"
  | "mcq"
  | "spreadsheet"
  | "page"

export interface BankQuestion {
  readonly id: string
  readonly title: string
  readonly domain: QuestionDomain
  readonly difficulty: QuestionDifficulty
  readonly company: string | null
  readonly status: QuestionStatus
  readonly format?: QuestionFormat
  readonly trackHint?: string | null
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
