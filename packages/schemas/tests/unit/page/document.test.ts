import { describe, expect, it } from "vitest"
import { pageDocumentBodySchema } from "@/page/document.js"

describe("pageDocumentBodySchema", () => {
  it("accepts html body", () => {
    const doc = pageDocumentBodySchema.parse({
      version: 1,
      html: "<p>hi</p>",
    })
    expect(doc.html).toBe("<p>hi</p>")
  })
})
