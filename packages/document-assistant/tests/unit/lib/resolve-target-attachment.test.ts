import { describe, expect, it } from "vitest"
import { resolveTargetAttachment } from "@/lib/resolve-target-attachment"

const resumeDoc = {
  header: {
    name: "Ada Lovelace",
    headline: "Engineer",
    contacts: [
      { id: "c1", kind: "email", value: "ada@example.com" },
      { id: "c2", kind: "phone", value: "" },
    ],
  },
  sections: [
    {
      id: "sum1",
      type: "summary",
      text: "<p>Built analytical engines.</p>",
    },
    {
      id: "exp1",
      type: "experience",
      entries: [
        {
          id: "e1",
          title: "Analyst",
          org: "Babbage Co",
          location: "London",
          startDate: "1840",
          endDate: "1850",
          url: "",
          bullets: "<ul><li>Notes</li></ul>",
        },
      ],
    },
    {
      id: "sk1",
      type: "skills",
      items: [{ id: "i1", text: "Math" }, { id: "i2", text: "Logic" }],
    },
  ],
}

const coverLetterDoc = {
  sender: {
    name: "Ada",
    title: "Engineer",
    contacts: [{ id: "c1", kind: "email", value: "ada@example.com" }],
  },
  recipient: {
    name: "Hiring Mgr",
    title: "CTO",
    company: "Acme",
    addressLines: ["1 Main St"],
  },
  blocks: [
    { id: "g1", type: "greeting", text: "<p>Dear team,</p>" },
    {
      id: "s1",
      type: "signoff",
      closing: "<p>Best,</p>",
      signature: "Ada",
    },
  ],
}

describe("resolveTargetAttachment", () => {
  it("returns null for empty target or document", () => {
    expect(resolveTargetAttachment("resume", resumeDoc, "  ")).toBeNull()
    expect(resolveTargetAttachment("resume", null, "header")).toBeNull()
  })

  it("resolves resume header", () => {
    const att = resolveTargetAttachment("resume", resumeDoc, "header")
    expect(att).not.toBeNull()
    expect(att!.primaryLabel).toBe("Header")
    expect(att!.text).toContain("Ada Lovelace")
    expect(att!.text).toContain("ada@example.com")
    expect(att!.text).not.toContain("phone")
  })

  it("resolves resume section by id", () => {
    const att = resolveTargetAttachment("resume", resumeDoc, "sum1")
    expect(att?.title).toBe("summary")
    expect(att?.text).toContain("Built analytical engines")
  })

  it("resolves experience entry via entry:section:entry", () => {
    const att = resolveTargetAttachment("resume", resumeDoc, "entry:exp1:e1")
    expect(att).not.toBeNull()
    expect(att!.groupLabel).toBe("experience")
    expect(att!.primaryLabel).toContain("Analyst")
    expect(att!.text).toContain("Babbage Co")
    expect(att!.text).toContain("Notes")
  })

  it("returns null for missing entry / wrong section type", () => {
    expect(
      resolveTargetAttachment("resume", resumeDoc, "entry:exp1:missing")
    ).toBeNull()
    expect(
      resolveTargetAttachment("resume", resumeDoc, "entry:sum1:e1")
    ).toBeNull()
  })

  it("resolves skills section items", () => {
    const att = resolveTargetAttachment("resume", resumeDoc, "sk1")
    expect(att?.text).toContain("Math")
    expect(att?.text).toContain("Logic")
  })

  it("resolves cover letter sender / recipient / block", () => {
    const sender = resolveTargetAttachment("cover_letter", coverLetterDoc, "sender")
    expect(sender?.primaryLabel).toBe("Sender")
    expect(sender?.text).toContain("Ada")

    const recipient = resolveTargetAttachment(
      "cover_letter",
      coverLetterDoc,
      "recipient"
    )
    expect(recipient?.text).toContain("Acme")
    expect(recipient?.text).toContain("1 Main St")

    const greeting = resolveTargetAttachment("cover_letter", coverLetterDoc, "g1")
    expect(greeting?.title).toBe("greeting")
    expect(greeting?.text).toContain("Dear team")

    const signoff = resolveTargetAttachment("cover_letter", coverLetterDoc, "s1")
    expect(signoff?.text).toContain("Best")
    expect(signoff?.text).toContain("Ada")
  })

  it("returns null for unknown block id", () => {
    expect(
      resolveTargetAttachment("cover_letter", coverLetterDoc, "nope")
    ).toBeNull()
  })
})
