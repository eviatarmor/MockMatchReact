import { describe, expect, it } from "vitest"
import { contentHash } from "@/modules/document-versions/service.js"

describe("contentHash", () => {
  it("is stable for same content regardless of object key order", () => {
    const a = contentHash({
      title: "Resume",
      templateId: "modern",
      style: { accent: "blue", density: "normal" },
      document: { header: { name: "Ada" }, sections: [] },
    })
    const b = contentHash({
      title: "Resume",
      templateId: "modern",
      style: { density: "normal", accent: "blue" },
      document: { sections: [], header: { name: "Ada" } },
    })
    expect(a).toBe(b)
    expect(a).toMatch(/^[a-f0-9]{64}$/)
  })

  it("changes when title or document changes", () => {
    const base = {
      title: "Resume",
      templateId: "modern",
      style: { accent: "blue" },
      document: { header: { name: "Ada" } },
    }
    expect(contentHash(base)).not.toBe(
      contentHash({ ...base, title: "Other" })
    )
    expect(contentHash(base)).not.toBe(
      contentHash({
        ...base,
        document: { header: { name: "Grace" } },
      })
    )
  })
})
