import { describe, expect, it } from "vitest"
import {
  resumeDocumentSchema,
  resumeSectionSchema,
  resumeTemplateIdSchema,
} from "@/resumes/document.js"

describe("resumeDocumentSchema", () => {
  it("accepts minimal resume", () => {
    const doc = resumeDocumentSchema.parse({
      header: {
        name: "Ada",
        headline: "Engineer",
        contacts: [],
      },
      sections: [{ id: "s1", type: "summary", text: "Hello" }],
    })
    expect(doc.header.name).toBe("Ada")
  })

  it("rejects unknown section type", () => {
    expect(() =>
      resumeDocumentSchema.parse({
        header: { name: "A", headline: "", contacts: [] },
        sections: [{ id: "s1", type: "nope", text: "x" }],
      })
    ).toThrow()
  })
})

describe("resumeSectionSchema variants", () => {
  it("experience entries", () => {
    const s = resumeSectionSchema.parse({
      id: "exp",
      type: "experience",
      entries: [
        {
          id: "e1",
          title: "SWE",
          org: "Acme",
          location: "Remote",
          url: "",
          startDate: "2020",
          endDate: "2024",
          bullets: "Built stuff",
        },
      ],
    })
    expect(s.type).toBe("experience")
  })

  it("skills / languages / references / custom", () => {
    expect(
      resumeSectionSchema.parse({
        id: "sk",
        type: "skills",
        items: [{ id: "i1", text: "TypeScript" }],
      }).type
    ).toBe("skills")

    expect(
      resumeSectionSchema.parse({
        id: "lang",
        type: "languages",
        items: [{ id: "l1", name: "English", proficiency: "Native" }],
      }).type
    ).toBe("languages")

    expect(
      resumeSectionSchema.parse({
        id: "ref",
        type: "references",
        items: [
          {
            id: "r1",
            name: "Boss",
            relation: "Manager",
            contact: "b@acme.com",
          },
        ],
      }).type
    ).toBe("references")

    expect(
      resumeSectionSchema.parse({
        id: "c1",
        type: "custom",
        heading: "Other",
        text: "Notes",
      }).type
    ).toBe("custom")
  })

  it("awards / certifications / publications / affiliations", () => {
    expect(
      resumeSectionSchema.parse({
        id: "a1",
        type: "awards",
        title: "Best",
        issuer: "Org",
        date: "2024",
        description: "Won",
      }).type
    ).toBe("awards")

    expect(
      resumeSectionSchema.parse({
        id: "cert",
        type: "certifications",
        name: "AWS",
        issuer: "Amazon",
        date: "2023",
        credentialId: "x",
      }).type
    ).toBe("certifications")

    expect(
      resumeSectionSchema.parse({
        id: "pub",
        type: "publications",
        title: "Paper",
        publisher: "IEEE",
        date: "2022",
        url: "https://example.com",
      }).type
    ).toBe("publications")

    expect(
      resumeSectionSchema.parse({
        id: "aff",
        type: "affiliations",
        organization: "ACM",
        role: "Member",
        date: "2021",
      }).type
    ).toBe("affiliations")
  })
})

describe("resumeTemplateIdSchema", () => {
  it("accepts known templates", () => {
    expect(resumeTemplateIdSchema.parse("modern")).toBe("modern")
    expect(resumeTemplateIdSchema.parse("banner")).toBe("banner")
    expect(() => resumeTemplateIdSchema.parse("neon")).toThrow()
  })
})
