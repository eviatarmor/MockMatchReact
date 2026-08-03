import { describe, expect, it } from "vitest"
import {
  HELP_TOPICS,
  helpTopicSchema,
  submitFeedbackInputSchema,
  submitHelpRequestInputSchema,
  supportAttachmentSchema,
  supportSubmitResultSchema,
} from "@/support/api.js"

describe("helpTopicSchema", () => {
  it("accepts known topics", () => {
    for (const t of HELP_TOPICS) {
      expect(helpTopicSchema.parse(t)).toBe(t)
    }
    expect(() => helpTopicSchema.parse("other")).toThrow()
  })
})

describe("supportAttachmentSchema", () => {
  it("accepts image mime + base64", () => {
    const a = supportAttachmentSchema.parse({
      fileName: "shot.png",
      mimeType: "image/png",
      dataBase64: "iVBORw0KGgo=",
    })
    expect(a.fileName).toBe("shot.png")
  })

  it("rejects non-image mime / empty data", () => {
    expect(() =>
      supportAttachmentSchema.parse({
        fileName: "a.pdf",
        mimeType: "application/pdf",
        dataBase64: "aaa",
      })
    ).toThrow()
    expect(() =>
      supportAttachmentSchema.parse({
        fileName: "a.png",
        mimeType: "image/png",
        dataBase64: "",
      })
    ).toThrow()
  })
})

describe("submitFeedbackInputSchema", () => {
  it("requires message length 10–2000", () => {
    expect(() =>
      submitFeedbackInputSchema.parse({ message: "too short" })
    ).toThrow()

    const ok = submitFeedbackInputSchema.parse({
      message: "This is long enough feedback.",
      path: "/dashboard",
      locale: "en-AU",
    })
    expect(ok.path).toBe("/dashboard")
  })

  it("caps attachments at 3", () => {
    const att = {
      fileName: "a.png",
      mimeType: "image/png" as const,
      dataBase64: "abc",
    }
    expect(
      submitFeedbackInputSchema.parse({
        message: "Enough characters here.",
        attachments: [att, att, att],
      }).attachments
    ).toHaveLength(3)

    expect(() =>
      submitFeedbackInputSchema.parse({
        message: "Enough characters here.",
        attachments: [att, att, att, att],
      })
    ).toThrow()
  })
})

describe("submitHelpRequestInputSchema", () => {
  it("requires topic + message", () => {
    const v = submitHelpRequestInputSchema.parse({
      topic: "billing",
      subject: "Invoice issue",
      message: "I was charged twice last month.",
    })
    expect(v.topic).toBe("billing")
    expect(v.subject).toBe("Invoice issue")
  })

  it("subject optional; rejects empty message", () => {
    expect(
      submitHelpRequestInputSchema.parse({
        topic: "bug",
        message: "Something broke on save flow.",
      }).subject
    ).toBeUndefined()

    expect(() =>
      submitHelpRequestInputSchema.parse({
        topic: "bug",
        message: "short",
      })
    ).toThrow()
  })
})

describe("supportSubmitResultSchema", () => {
  it("ok must be true", () => {
    expect(supportSubmitResultSchema.parse({ ok: true }).ok).toBe(true)
    expect(
      supportSubmitResultSchema.parse({ ok: true, ticketKey: "SUP-1" })
        .ticketKey
    ).toBe("SUP-1")
    expect(() => supportSubmitResultSchema.parse({ ok: false })).toThrow()
  })
})
