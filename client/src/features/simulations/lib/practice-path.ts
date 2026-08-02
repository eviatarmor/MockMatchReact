import { idePathForTrackId } from "@/features/simulation-ide/constants"
import { INTERVIEW_TRACKS } from "../constants"
import type { BankQuestion } from "@/features/question-bank/types"

export const CONVERSATION_BASE_PATH = "/simulations/conversation"
/** Bank-sourced IDE practice (code_run / workspace / terminal). */
export const QUESTION_PRACTICE_BASE_PATH = "/simulations/practice"

/** App path for a conversation track session. */
export function conversationPathForTrackId(trackId: string): string {
  return `${CONVERSATION_BASE_PATH}/${trackId}`
}

/** IDE path for a global bank question. */
export function practicePathForQuestionId(questionId: string): string {
  return `${QUESTION_PRACTICE_BASE_PATH}/${questionId}`
}

/**
 * Catalog track id → practice path (IDE formats + conversation + bank `q:`).
 */
export function practicePathForTrackId(trackId: string): string | null {
  if (trackId.startsWith("q:")) {
    const id = trackId.slice(2)
    if (id) return practicePathForQuestionId(id)
  }
  const track = INTERVIEW_TRACKS.find((t) => t.id === trackId)
  if (track?.format === "conversation") {
    return conversationPathForTrackId(trackId)
  }
  return idePathForTrackId(trackId)
}

/**
 * Question bank Practice button.
 * URLs use only the question UUID (no job titles / free-form track slugs).
 * - conversation → /simulations/conversation/:questionId
 * - code / workspace / terminal → /simulations/practice/:questionId
 */
export function practicePathForBankQuestion(
  q: Pick<BankQuestion, "id" | "format" | "trackHint">
): string | null {
  if (q.format === "conversation") {
    return conversationPathForTrackId(q.id)
  }
  if (
    q.format === "code_run" ||
    q.format === "workspace" ||
    q.format === "terminal"
  ) {
    return practicePathForQuestionId(q.id)
  }
  return null
}
