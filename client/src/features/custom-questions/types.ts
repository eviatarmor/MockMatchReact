import type {
  QuestionDomain,
  QuestionDifficulty,
  QuestionFormat,
  QuestionPublishStatus,
} from "@mockmatch/schemas"

export type { QuestionDomain, QuestionDifficulty, QuestionFormat, QuestionPublishStatus }

export type McqVariant = "single" | "multi" | "order"

export type ConversationTrackHint =
  | "behavioral-core"
  | "product-sense"
  | "system-design-talk"

export interface CustomQuestionRow {
  readonly id: string
  readonly title: string
  readonly domain: QuestionDomain
  readonly difficulty: QuestionDifficulty
  readonly format: QuestionFormat
  readonly publishStatus: QuestionPublishStatus
  readonly company: string | null
  readonly language: string | null
  readonly updatedAt: string
}

export interface CreateCustomFormState {
  title: string
  domain: QuestionDomain
  difficulty: QuestionDifficulty
  format: QuestionFormat
  /** Shared prompt / stem / body across formats */
  prompt: string
  language: string
  company: string
  /** MCQ */
  mcqVariant: McqVariant
  options: string[]
  correctIndex: number
  correctIndices: number[]
  /** Conversation — empty string means auto from domain */
  trackHint: ConversationTrackHint | "auto"
  /** Code-like starter */
  starterCode: string
}

export interface SimulationTypeCard {
  readonly id: string
  readonly format: QuestionFormat
  readonly createSupported: boolean
  readonly notes: string | null
}
