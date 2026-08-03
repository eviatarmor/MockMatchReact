import { describe, expect, it } from "vitest"
import {
  isReplaceDocumentTextPart,
  REPLACE_DOCUMENT_TEXT_TOOL,
} from "@/lib/replace-tool"

describe("REPLACE_DOCUMENT_TEXT_TOOL", () => {
  it("is stable tool name", () => {
    expect(REPLACE_DOCUMENT_TEXT_TOOL).toBe("replace_document_text")
  })
})

describe("isReplaceDocumentTextPart", () => {
  it("accepts tool-replace_document_text type", () => {
    expect(
      isReplaceDocumentTextPart({ type: "tool-replace_document_text" })
    ).toBe(true)
  })

  it("rejects other tool / message parts", () => {
    expect(isReplaceDocumentTextPart({ type: "text" })).toBe(false)
    expect(isReplaceDocumentTextPart({ type: "tool-other" })).toBe(false)
    expect(
      isReplaceDocumentTextPart({ type: "tool-replace_document" })
    ).toBe(false)
  })
})
