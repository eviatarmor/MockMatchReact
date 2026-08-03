import { idePathForTrackId } from "@/features/simulation-ide/constants"
import { INTERVIEW_TRACKS } from "../constants"
import type { BankQuestion } from "@/features/question-bank/types"

export const CONVERSATION_BASE_PATH = "/simulations/conversation"
/** Bank-sourced IDE practice (code_run / workspace / terminal). */
export const QUESTION_PRACTICE_BASE_PATH = "/simulations/practice"
/** Bank-sourced MCQ practice. */
export const QUESTION_MCQ_BASE_PATH = "/simulations/mcq"
/** Bank-sourced whiteboard practice. */
export const QUESTION_WHITEBOARD_BASE_PATH = "/simulations/whiteboard"
/** Freeform spreadsheet practice. */
export const SPREADSHEET_PRACTICE_PATH = "/simulations/spreadsheet"
/** Freeform document analysis page practice. */
export const PAGE_PRACTICE_PATH = "/simulations/page"

/** App path for a conversation track session. */
export function conversationPathForTrackId(trackId: string): string {
  return `${CONVERSATION_BASE_PATH}/${trackId}`
}

/** IDE path for a global bank question. */
export function practicePathForQuestionId(questionId: string): string {
  return `${QUESTION_PRACTICE_BASE_PATH}/${questionId}`
}

/** MCQ path for a global bank question. */
export function mcqPathForQuestionId(questionId: string): string {
  return `${QUESTION_MCQ_BASE_PATH}/${questionId}`
}

/** Whiteboard path for a global bank question. */
export function whiteboardPathForQuestionId(questionId: string): string {
  return `${QUESTION_WHITEBOARD_BASE_PATH}/${questionId}`
}

/**
 * Route bank question id + format → practice URL.
 */
export function practicePathForFormat(
  questionId: string,
  format: string | undefined | null
): string | null {
  if (format === "conversation") return conversationPathForTrackId(questionId)
  if (format === "mcq") return mcqPathForQuestionId(questionId)
  if (format === "whiteboard") return whiteboardPathForQuestionId(questionId)
  if (format === "spreadsheet") return SPREADSHEET_PRACTICE_PATH
  if (format === "page") return PAGE_PRACTICE_PATH
  if (
    format === "code_run" ||
    format === "workspace" ||
    format === "terminal"
  ) {
    return practicePathForQuestionId(questionId)
  }
  return null
}

/**
 * Catalog track id → practice path (IDE formats + conversation + bank `q:`).
 * Bank `q:` rows need format from the session/list; without format, prefer IDE practice URL.
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
  if (track?.format === "spreadsheet" || trackId === "spreadsheet") {
    return SPREADSHEET_PRACTICE_PATH
  }
  if (track?.format === "page" || trackId === "page") {
    return PAGE_PRACTICE_PATH
  }
  return idePathForTrackId(trackId)
}

/**
 * Question bank Practice button.
 * URLs use only the question UUID (no job titles / free-form track slugs).
 * - conversation → /simulations/conversation/:questionId
 * - mcq → /simulations/mcq/:questionId
 * - whiteboard → /simulations/whiteboard/:questionId
 * - code / workspace / terminal → /simulations/practice/:questionId
 */
export function practicePathForBankQuestion(
  q: Pick<BankQuestion, "id" | "format" | "trackHint">
): string | null {
  return practicePathForFormat(q.id, q.format)
}
