import { describe, expect, it } from "vitest"
import {
  buildCreatePayload,
  canSubmitCreate,
  defaultFormState,
} from "@/features/custom-questions/constants"

describe("buildCreatePayload", () => {
  it("builds mcq single payload", () => {
    const state = defaultFormState("mcq")
    state.title = "Math"
    state.prompt = "2+2?"
    state.options = ["3", "4", "5", ""]
    state.correctIndex = 1
    expect(buildCreatePayload(state)).toEqual({
      stem: "2+2?",
      options: ["3", "4", "5"],
      variant: "single",
      correctIndex: 1,
    })
  })

  it("builds conversation without track when auto", () => {
    const state = defaultFormState("conversation")
    state.prompt = "Tell me about conflict."
    state.trackHint = "auto"
    expect(buildCreatePayload(state)).toEqual({
      interviewerPrompt: "Tell me about conflict.",
    })
  })

  it("builds code_run with starter", () => {
    const state = defaultFormState("code_run")
    state.prompt = "Reverse a string"
    state.starterCode = "def reverse(s):\n    pass\n"
    expect(buildCreatePayload(state)).toMatchObject({
      prompt: "Reverse a string",
      starterCode: "def reverse(s):\n    pass\n",
    })
  })

  it("builds whiteboard prompt only", () => {
    const state = defaultFormState("whiteboard")
    state.prompt = "Design a rate limiter"
    expect(buildCreatePayload(state)).toEqual({
      prompt: "Design a rate limiter",
    })
  })
})

describe("canSubmitCreate", () => {
  it("requires title and prompt", () => {
    const state = defaultFormState("whiteboard")
    expect(canSubmitCreate(state)).toBe(false)
    state.title = "x"
    state.prompt = "y"
    expect(canSubmitCreate(state)).toBe(true)
  })

  it("requires two mcq options", () => {
    const state = defaultFormState("mcq")
    state.title = "x"
    state.prompt = "y"
    state.options = ["only", "", "", ""]
    expect(canSubmitCreate(state)).toBe(false)
    state.options = ["a", "b", "", ""]
    expect(canSubmitCreate(state)).toBe(true)
  })
})
