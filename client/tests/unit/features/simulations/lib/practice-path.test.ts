import { describe, expect, it } from "vitest"
import {
  CONVERSATION_BASE_PATH,
  conversationPathForTrackId,
  mcqPathForQuestionId,
  practicePathForBankQuestion,
  practicePathForFormat,
  practicePathForQuestionId,
  practicePathForTrackId,
  QUESTION_MCQ_BASE_PATH,
  QUESTION_PRACTICE_BASE_PATH,
  QUESTION_WHITEBOARD_BASE_PATH,
  whiteboardPathForQuestionId,
} from "@/features/simulations/lib/practice-path"

describe("practice path helpers", () => {
  it("builds fixed base paths", () => {
    expect(conversationPathForTrackId("behavioral-core")).toBe(
      `${CONVERSATION_BASE_PATH}/behavioral-core`
    )
    expect(practicePathForQuestionId("q-1")).toBe(
      `${QUESTION_PRACTICE_BASE_PATH}/q-1`
    )
    expect(mcqPathForQuestionId("q-2")).toBe(`${QUESTION_MCQ_BASE_PATH}/q-2`)
    expect(whiteboardPathForQuestionId("q-3")).toBe(
      `${QUESTION_WHITEBOARD_BASE_PATH}/q-3`
    )
  })

  it("maps format → path", () => {
    expect(practicePathForFormat("id1", "conversation")).toBe(
      `${CONVERSATION_BASE_PATH}/id1`
    )
    expect(practicePathForFormat("id2", "mcq")).toBe(
      `${QUESTION_MCQ_BASE_PATH}/id2`
    )
    expect(practicePathForFormat("id3", "whiteboard")).toBe(
      `${QUESTION_WHITEBOARD_BASE_PATH}/id3`
    )
    expect(practicePathForFormat("id4", "code_run")).toBe(
      `${QUESTION_PRACTICE_BASE_PATH}/id4`
    )
    expect(practicePathForFormat("id5", "workspace")).toBe(
      `${QUESTION_PRACTICE_BASE_PATH}/id5`
    )
    expect(practicePathForFormat("id6", "terminal")).toBe(
      `${QUESTION_PRACTICE_BASE_PATH}/id6`
    )
    expect(practicePathForFormat("id7", "unknown")).toBeNull()
    expect(practicePathForFormat("id8", null)).toBeNull()
  })

  it("resolves bank question practice path", () => {
    expect(
      practicePathForBankQuestion({
        id: "uuid-1",
        format: "mcq",
        trackHint: null,
      })
    ).toBe(`${QUESTION_MCQ_BASE_PATH}/uuid-1`)
  })

  it("resolves track ids (q: prefix + conversation catalog)", () => {
    expect(practicePathForTrackId("q:abc-123")).toBe(
      `${QUESTION_PRACTICE_BASE_PATH}/abc-123`
    )
    expect(practicePathForTrackId("behavioral-core")).toBe(
      `${CONVERSATION_BASE_PATH}/behavioral-core`
    )
  })
})
