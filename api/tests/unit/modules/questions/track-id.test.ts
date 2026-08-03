import { describe, expect, it } from "vitest"
import {
  parseQuestionTrackId,
  questionTrackId,
  resolveConversationTrackId,
} from "@/modules/questions/service.js"

describe("questionTrackId", () => {
  it("prefixes question id with q:", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000"
    expect(questionTrackId(id)).toBe(`q:${id}`)
  })
})

describe("parseQuestionTrackId", () => {
  it("extracts uuid from q: prefix", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000"
    expect(parseQuestionTrackId(`q:${id}`)).toBe(id)
  })

  it("returns null for non-q tracks", () => {
    expect(parseQuestionTrackId("js-sum")).toBeNull()
    expect(parseQuestionTrackId("behavioral-core")).toBeNull()
  })

  it("returns null for malformed uuid after prefix", () => {
    expect(parseQuestionTrackId("q:not-a-uuid")).toBeNull()
    expect(parseQuestionTrackId("q:")).toBeNull()
  })
})

describe("resolveConversationTrackId", () => {
  it("keeps known track hints", () => {
    expect(resolveConversationTrackId("behavioral-core")).toBe(
      "behavioral-core"
    )
    expect(resolveConversationTrackId("product-sense")).toBe("product-sense")
    expect(resolveConversationTrackId("system-design-talk")).toBe(
      "system-design-talk"
    )
  })

  it("maps domain when hint missing or unknown", () => {
    expect(resolveConversationTrackId(null, "product")).toBe("product-sense")
    expect(resolveConversationTrackId("nope", "systemDesign")).toBe(
      "system-design-talk"
    )
    expect(resolveConversationTrackId(undefined, "coding")).toBe(
      "behavioral-core"
    )
  })
})
