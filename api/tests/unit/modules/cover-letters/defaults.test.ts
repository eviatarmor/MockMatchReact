import { describe, expect, it } from "vitest"
import {
  blankCoverLetterDocument,
  DEFAULT_STYLE,
  DEFAULT_TEMPLATE_ID,
} from "@/modules/cover-letters/defaults.js"

describe("cover letter defaults", () => {
  it("uses modern template and default style axes", () => {
    expect(DEFAULT_TEMPLATE_ID).toBe("modern")
    expect(DEFAULT_STYLE).toEqual({
      accent: "blue",
      typeface: "geist",
      heading: "accent",
      density: "normal",
    })
  })

  it("blankCoverLetterDocument has sender contacts and block types", () => {
    const doc = blankCoverLetterDocument()
    expect(doc.sender.name).toBe("")
    expect(doc.sender.contacts).toHaveLength(5)
    expect(doc.sender.contacts.map((c) => c.iconKey)).toEqual([
      "mail",
      "phone",
      "mapPin",
      "globe",
      "link",
    ])
    expect(doc.recipient.addressLines).toEqual([""])

    const types = doc.blocks.map((b) => b.type)
    expect(types).toContain("greeting")
    expect(types).toContain("paragraph")
    expect(types).toContain("signoff")

    const ids = [
      ...doc.sender.contacts.map((c) => c.id),
      ...doc.blocks.map((b) => b.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => id.length > 0)).toBe(true)
  })

  it("creates independent documents each call", () => {
    const a = blankCoverLetterDocument()
    const b = blankCoverLetterDocument()
    a.sender.name = "X"
    expect(b.sender.name).toBe("")
    expect(a.blocks[0]?.id).not.toBe(b.blocks[0]?.id)
  })
})
