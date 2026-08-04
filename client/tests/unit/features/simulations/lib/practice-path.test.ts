import { describe, expect, it } from "vitest"
import {
  CONVERSATION_BASE_PATH,
  conversationPathForTrackId,
  mcqPathForQuestionId,
  practicePathForBankQuestion,
  practicePathForFormat,
  practicePathForQuestionId,
  practicePathForTrackId,
  SIMULATIONS_BASE_PATH,
  whiteboardPathForQuestionId,
} from "@/features/simulations/lib/practice-path"

describe("practice path helpers", () => {
  it("builds unified bank paths under /simulations/:id", () => {
    expect(practicePathForQuestionId("q-1")).toBe(
      `${SIMULATIONS_BASE_PATH}/q-1`
    )
    expect(mcqPathForQuestionId("q-2")).toBe(`${SIMULATIONS_BASE_PATH}/q-2`)
    expect(whiteboardPathForQuestionId("q-3")).toBe(
      `${SIMULATIONS_BASE_PATH}/q-3`
    )
    expect(conversationPathForTrackId("behavioral-core")).toBe(
      `${CONVERSATION_BASE_PATH}/behavioral-core`
    )
    expect(conversationPathForTrackId("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(
      `${SIMULATIONS_BASE_PATH}/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`
    )
  })

  it("maps every bank format → /simulations/:id", () => {
    for (const format of [
      "conversation",
      "mcq",
      "whiteboard",
      "code_run",
      "workspace",
      "terminal",
      "spreadsheet",
      "page",
    ]) {
      expect(practicePathForFormat("id1", format)).toBe(
        `${SIMULATIONS_BASE_PATH}/id1`
      )
    }
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
    ).toBe(`${SIMULATIONS_BASE_PATH}/uuid-1`)
    expect(
      practicePathForBankQuestion({
        id: "uuid-2",
        format: "whiteboard",
        trackHint: null,
      })
    ).toBe(`${SIMULATIONS_BASE_PATH}/uuid-2`)
  })

  it("resolves track ids (q: prefix + conversation catalog)", () => {
    expect(practicePathForTrackId("q:abc-123")).toBe(
      `${SIMULATIONS_BASE_PATH}/abc-123`
    )
    expect(practicePathForTrackId("behavioral-core")).toBe(
      `${CONVERSATION_BASE_PATH}/behavioral-core`
    )
  })
})
