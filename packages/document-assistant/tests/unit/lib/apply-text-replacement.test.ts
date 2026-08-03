import { describe, expect, it } from "vitest"
import { applyDocumentTextReplacement } from "@/lib/apply-text-replacement"
import type { ResumeDocumentDto } from "@mockmatch/schemas"

const baseResume = {
  header: {
    name: "Ada Lovelace",
    headline: "Engineer",
    contacts: [{ id: "c1", iconKey: "mail" as const, value: "ada@example.com" }],
  },
  sections: [
    {
      id: "s1",
      type: "summary" as const,
      text: "Built analytical engines.",
    },
  ],
} satisfies ResumeDocumentDto

describe("applyDocumentTextReplacement", () => {
  it("rejects empty find", () => {
    const r = applyDocumentTextReplacement("resume", baseResume, {
      find: "",
      replacement: "x",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("empty_find")
  })

  it("replaces in resume header/summary", () => {
    const r = applyDocumentTextReplacement("resume", baseResume, {
      find: "Ada",
      replacement: "Augusta",
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.count).toBeGreaterThan(0)
      const doc = r.document as ResumeDocumentDto
      expect(doc.header.name).toContain("Augusta")
    }
  })

  it("returns not_found when missing", () => {
    const r = applyDocumentTextReplacement("resume", baseResume, {
      find: "zzzz-missing",
      replacement: "x",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("not_found")
  })
})
