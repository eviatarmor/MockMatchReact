import { describe, expect, it } from "vitest"
import {
  blankResumeDocument,
  DEFAULT_STYLE,
  DEFAULT_TEMPLATE_ID,
} from "@/modules/resumes/defaults.js"

describe("resume defaults", () => {
  it("uses modern template and default style axes", () => {
    expect(DEFAULT_TEMPLATE_ID).toBe("modern")
    expect(DEFAULT_STYLE).toEqual({
      accent: "blue",
      typeface: "geist",
      heading: "accent",
      density: "normal",
    })
  })

  it("blankResumeDocument has empty header contacts and core sections", () => {
    const doc = blankResumeDocument()
    expect(doc.header.name).toBe("")
    expect(doc.header.headline).toBe("")
    expect(doc.header.contacts).toHaveLength(5)
    expect(doc.header.contacts.map((c) => c.iconKey)).toEqual([
      "mail",
      "phone",
      "mapPin",
      "globe",
      "link",
    ])

    const types = doc.sections.map((s) => s.type)
    expect(types).toEqual(["summary", "experience", "education", "skills"])

    const summary = doc.sections.find((s) => s.type === "summary")
    expect(summary && summary.type === "summary" && summary.text).toBe("")

    const exp = doc.sections.find((s) => s.type === "experience")
    expect(exp && exp.type === "experience" && exp.entries).toHaveLength(1)

    // ids are unique non-empty strings
    const ids = [
      ...doc.header.contacts.map((c) => c.id),
      ...doc.sections.map((s) => s.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => id.length > 0)).toBe(true)
  })

  it("creates independent documents each call", () => {
    const a = blankResumeDocument()
    const b = blankResumeDocument()
    a.header.name = "X"
    expect(b.header.name).toBe("")
    const aSummary = a.sections.find((s) => s.type === "summary")
    const bSummary = b.sections.find((s) => s.type === "summary")
    expect(aSummary?.id).not.toBe(bSummary?.id)
  })
})
