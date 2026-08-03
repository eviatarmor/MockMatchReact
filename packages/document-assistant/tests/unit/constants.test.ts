import { describe, expect, it } from "vitest"
import {
  DOCUMENT_AI_SUGGESTION_IDS,
  DOCUMENT_AI_WELCOME_ID,
} from "@/constants"
import { isReplaceDocumentTextPart, REPLACE_DOCUMENT_TEXT_TOOL } from "@/lib/replace-tool"

describe("DOCUMENT_AI_SUGGESTION_IDS", () => {
  it("lists stable suggestion ids for i18n", () => {
    expect(DOCUMENT_AI_SUGGESTION_IDS).toContain("improveClarity")
    expect(DOCUMENT_AI_SUGGESTION_IDS).toContain("addMetrics")
    expect(DOCUMENT_AI_SUGGESTION_IDS).toContain("shorten")
    expect(DOCUMENT_AI_SUGGESTION_IDS).toContain("strongerOpening")
    expect(DOCUMENT_AI_SUGGESTION_IDS).toContain("fixGrammar")
    expect(DOCUMENT_AI_SUGGESTION_IDS).toContain("tailorRole")
    expect(DOCUMENT_AI_SUGGESTION_IDS).toHaveLength(6)
  })

  it("ids are unique", () => {
    expect(new Set(DOCUMENT_AI_SUGGESTION_IDS).size).toBe(
      DOCUMENT_AI_SUGGESTION_IDS.length
    )
  })
})

describe("DOCUMENT_AI_WELCOME_ID", () => {
  it("stable welcome message id", () => {
    expect(DOCUMENT_AI_WELCOME_ID).toBe("document-ai-welcome")
  })
})

describe("replace tool constants (cross-check)", () => {
  it("tool name stable for stream parts", () => {
    expect(REPLACE_DOCUMENT_TEXT_TOOL).toBe("replace_document_text")
    expect(isReplaceDocumentTextPart({ type: "tool-replace_document_text" })).toBe(
      true
    )
    expect(isReplaceDocumentTextPart({ type: "text" })).toBe(false)
  })
})
