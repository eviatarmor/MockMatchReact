import { describe, expect, it } from "vitest"
import {
  buildCompactText,
  buildMultiResumeProfile,
  extractFromDocument,
  type ResumeFitProfile,
  type ResumeRowForFit,
} from "@/modules/jobs/fit/extract-profile.js"

const sampleDoc = {
  header: { name: "Ada", headline: "Staff Engineer" },
  sections: [
    { id: "s1", type: "summary", text: "Builds systems." },
    {
      id: "s2",
      type: "skills",
      items: [
        { id: "k1", text: "React, TypeScript" },
        { id: "k2", text: "Python/Django" },
      ],
    },
    {
      id: "s3",
      type: "experience",
      entries: [
        {
          id: "e1",
          title: "Staff Engineer",
          org: "Acme",
          startDate: "2020",
          endDate: "Present",
          bullets: "Led platform\nMentored team\nExtra bullet four",
        },
      ],
    },
    {
      id: "s4",
      type: "education",
      entries: [{ id: "ed1", title: "BS CS", org: "MIT" }],
    },
    {
      id: "s5",
      type: "certifications",
      name: "AWS SAA",
    },
  ],
}

describe("extractFromDocument", () => {
  it("returns empty shape for non-object", () => {
    expect(extractFromDocument(null)).toEqual({
      skills: [],
      experience: [],
      headline: "",
      summary: "",
      education: [],
      certifications: [],
    })
  })

  it("extracts skills, experience, education, certs", () => {
    const out = extractFromDocument(sampleDoc)
    expect(out.headline).toBe("Staff Engineer")
    expect(out.summary).toBe("Builds systems.")
    expect(out.skills).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Python", "Django"])
    )
    expect(out.experience).toHaveLength(1)
    expect(out.experience[0]).toMatchObject({
      title: "Staff Engineer",
      org: "Acme",
      dates: "2020 – Present",
    })
    // max 3 bullets
    expect(out.experience[0]!.bullets).toHaveLength(3)
    expect(out.education).toContain("BS CS @ MIT")
    expect(out.certifications).toContain("AWS SAA")
  })

  it("dedupes skills case-insensitively", () => {
    const out = extractFromDocument({
      sections: [
        {
          type: "skills",
          items: [{ text: "React" }, { text: "react" }, { text: "REACT" }],
        },
      ],
    })
    expect(out.skills).toEqual(["React"])
  })
})

describe("buildMultiResumeProfile", () => {
  it("returns null for empty rows", () => {
    expect(buildMultiResumeProfile([])).toBeNull()
  })

  it("merges multiple resumes and hashes profile", () => {
    const rows: ResumeRowForFit[] = [
      {
        id: "r1",
        title: "Primary",
        targetRole: "Backend Engineer",
        company: null,
        document: sampleDoc,
      },
      {
        id: "r2",
        title: "Alt",
        targetRole: "Platform Engineer",
        company: "Other",
        document: {
          header: { headline: "Platform" },
          sections: [
            {
              type: "skills",
              items: [{ text: "Go" }, { text: "React" }],
            },
            {
              type: "experience",
              entries: [
                {
                  title: "Platform Eng",
                  org: "Beta",
                  bullets: "Kubernetes",
                },
              ],
            },
          ],
        },
      },
    ]
    const profile = buildMultiResumeProfile(rows)!
    expect(profile.resumeCount).toBe(2)
    expect(profile.resumeIds).toEqual(["r1", "r2"])
    expect(profile.targetRoles).toEqual(
      expect.arrayContaining(["Backend Engineer", "Platform Engineer"])
    )
    expect(profile.skills).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Go"])
    )
    expect(profile.experience.length).toBeGreaterThanOrEqual(2)
    expect(profile.profileHash).toMatch(/^[a-f0-9]{32}$/)
    expect(profile.compactText.length).toBeGreaterThan(0)

    // stable hash for same content
    expect(buildMultiResumeProfile(rows)!.profileHash).toBe(profile.profileHash)
  })
})

describe("buildCompactText", () => {
  it("includes skills and roles", () => {
    const partial: Omit<ResumeFitProfile, "compactText" | "profileHash"> = {
      resumeIds: ["r1"],
      resumeCount: 1,
      skills: ["React", "Go"],
      experience: [
        {
          title: "Eng",
          org: "Acme",
          dates: "2020",
          bullets: ["Did things"],
        },
      ],
      targetRoles: ["Engineer"],
      headlines: ["Builder"],
      education: ["BS"],
      certifications: ["AWS"],
      summaries: ["I build."],
    }
    const text = buildCompactText(partial)
    expect(text).toContain("Target roles: Engineer")
    expect(text).toContain("Skills: React, Go")
    expect(text).toContain("Role: Eng @ Acme")
    expect(text).toContain("Education: BS")
    expect(text).toContain("Certs: AWS")
  })
})
