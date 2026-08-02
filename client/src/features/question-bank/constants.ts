import type { QuestionDomain, QuestionDifficulty, QuestionStatus } from "./types"

/** Global bank is server-backed; no hard-coded questions. */
export const MOCK_QUESTIONS: readonly never[] = []

export const QUESTION_DOMAINS: readonly QuestionDomain[] = [
  "coding",
  "systemDesign",
  "caseStudy",
  "product",
  "behavioral",
  "finance",
  "clinical",
]

export const QUESTION_DIFFICULTIES: readonly QuestionDifficulty[] = [
  "easy",
  "medium",
  "hard",
]

export const QUESTION_STATUSES: readonly QuestionStatus[] = [
  "new",
  "attempted",
  "mastered",
]
