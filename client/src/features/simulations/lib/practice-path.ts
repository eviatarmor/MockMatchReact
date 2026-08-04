import { idePathForTrackId } from "@/features/simulation-ide/constants"
import { INTERVIEW_TRACKS } from "../constants"
import type { BankQuestion } from "@/features/question-bank/types"

/** Bank practice: one path for every format — surface chosen by question format. */
export const SIMULATIONS_BASE_PATH = "/simulations"
/** @deprecated Use SIMULATIONS_BASE_PATH — bank practice is no longer nested by format. */
export const QUESTION_PRACTICE_BASE_PATH = SIMULATIONS_BASE_PATH
/** Catalog conversation tracks (non-UUID slugs). Bank conversation uses /simulations/:questionId. */
export const CONVERSATION_BASE_PATH = "/simulations/conversation"
/** @deprecated Prefer practicePathForQuestionId — format segments removed. */
export const QUESTION_MCQ_BASE_PATH = SIMULATIONS_BASE_PATH
/** @deprecated Prefer practicePathForQuestionId — format segments removed. */
export const QUESTION_WHITEBOARD_BASE_PATH = SIMULATIONS_BASE_PATH
/** Freeform spreadsheet practice (no bank id). */
export const SPREADSHEET_PRACTICE_PATH = "/simulations/spreadsheet"
/** Freeform document analysis page practice (no bank id). */
export const PAGE_PRACTICE_PATH = "/simulations/page"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Reserved path segments under /simulations that are not bank question ids. */
export const SIMULATION_RESERVED_SEGMENTS = new Set([
  "tracks",
  "code-run",
  "workspace",
  "terminal-lab",
  "conversation",
  "spreadsheet",
  "page",
  "practice",
  "mcq",
  "whiteboard",
])

/** App path for a catalog conversation track session. */
export function conversationPathForTrackId(trackId: string): string {
  if (UUID_RE.test(trackId)) {
    return practicePathForQuestionId(trackId)
  }
  return `${CONVERSATION_BASE_PATH}/${trackId}`
}

/** Bank question practice URL (all formats). */
export function practicePathForQuestionId(questionId: string): string {
  return `${SIMULATIONS_BASE_PATH}/${questionId}`
}

/** MCQ path for a global bank question (same as unified practice path). */
export function mcqPathForQuestionId(questionId: string): string {
  return practicePathForQuestionId(questionId)
}

/** Whiteboard path for a global bank question (same as unified practice path). */
export function whiteboardPathForQuestionId(questionId: string): string {
  return practicePathForQuestionId(questionId)
}

/**
 * Route bank question id + format → practice URL.
 * All bank formats use `/simulations/:questionId` (dispatcher picks the surface).
 */
export function practicePathForFormat(
  questionId: string,
  format: string | undefined | null
): string | null {
  if (
    format === "conversation" ||
    format === "mcq" ||
    format === "whiteboard" ||
    format === "spreadsheet" ||
    format === "page" ||
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
 * Bank `q:` rows need format from the session/list; without format, prefer bank URL.
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
 * URLs use only the question UUID under /simulations/:questionId.
 */
export function practicePathForBankQuestion(
  q: Pick<BankQuestion, "id" | "format" | "trackHint">
): string | null {
  return practicePathForFormat(q.id, q.format)
}
