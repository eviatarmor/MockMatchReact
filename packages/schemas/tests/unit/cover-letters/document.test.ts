import { describe, expect, it } from "vitest"
import {
  coverLetterDocumentSchema,
  coverLetterTemplateIdSchema,
  letterBlockSchema,
  letterRecipientSchema,
  letterSenderSchema,
} from "@/cover-letters/document.js"

describe("letterSenderSchema / letterRecipientSchema", () => {
  it("parses sender with contacts", () => {
    const s = letterSenderSchema.parse({
      name: "Ada",
      title: "Engineer",
      contacts: [{ id: "c1", iconKey: "mail", value: "a@b.co" }],
    })
    expect(s.contacts[0]?.iconKey).toBe("mail")
  })

  it("recipient company required; name optional", () => {
    const r = letterRecipientSchema.parse({ company: "Acme" })
    expect(r.company).toBe("Acme")
    expect(r.name).toBeUndefined()
    expect(() => letterRecipientSchema.parse({})).toThrow()
  })
})

describe("letterBlockSchema", () => {
  it("accepts greeting/paragraph/subject", () => {
    expect(
      letterBlockSchema.parse({ id: "1", type: "greeting", text: "Dear Hiring," })
        .type
    ).toBe("greeting")
    expect(
      letterBlockSchema.parse({ id: "2", type: "paragraph", text: "Body" }).type
    ).toBe("paragraph")
    expect(
      letterBlockSchema.parse({ id: "3", type: "subject", text: "Re: Role" })
        .type
    ).toBe("subject")
  })

  it("accepts signoff + custom", () => {
    expect(
      letterBlockSchema.parse({
        id: "4",
        type: "signoff",
        closing: "Best,",
        signature: "Ada",
      }).type
    ).toBe("signoff")
    expect(
      letterBlockSchema.parse({
        id: "5",
        type: "custom",
        heading: "P.S.",
        text: "Thanks",
      }).type
    ).toBe("custom")
  })

  it("rejects unknown type / missing id", () => {
    expect(() =>
      letterBlockSchema.parse({ id: "1", type: "footer", text: "x" })
    ).toThrow()
    expect(() =>
      letterBlockSchema.parse({ id: "", type: "paragraph", text: "x" })
    ).toThrow()
  })
})

describe("coverLetterDocumentSchema", () => {
  it("accepts minimal letter", () => {
    const doc = coverLetterDocumentSchema.parse({
      sender: { name: "Ada", title: "Eng", contacts: [] },
      date: "1 Jan 2026",
      recipient: { company: "Acme" },
      blocks: [{ id: "b1", type: "greeting", text: "Hello," }],
    })
    expect(doc.blocks).toHaveLength(1)
  })

  it("rejects incomplete sender", () => {
    expect(() =>
      coverLetterDocumentSchema.parse({
        sender: { name: "Ada" },
        date: "",
        recipient: { company: "Acme" },
        blocks: [],
      })
    ).toThrow()
  })
})

describe("coverLetterTemplateIdSchema", () => {
  it("accepts known templates", () => {
    expect(coverLetterTemplateIdSchema.parse("modern")).toBe("modern")
    expect(coverLetterTemplateIdSchema.parse("elegant")).toBe("elegant")
    expect(() => coverLetterTemplateIdSchema.parse("neon")).toThrow()
  })
})
