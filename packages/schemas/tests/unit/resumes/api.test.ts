import { describe, expect, it } from "vitest"
import {
  resumeCreateInputSchema,
  resumeIdInputSchema,
  resumeListInputSchema,
  resumeUpdateInputSchema,
} from "@/resumes/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

const style = {
  accent: "teal" as const,
  typeface: "source-serif" as const,
  heading: "underline" as const,
  density: "compact" as const,
}

const document = {
  header: { name: "Ada", headline: "Engineer", contacts: [] },
  sections: [{ id: "s1", type: "summary" as const, text: "Hello" }],
}

describe("resumeListInputSchema", () => {
  it("defaults + search", () => {
    expect(resumeListInputSchema.parse({}).pageSize).toBe(10)
    expect(
      resumeListInputSchema.parse({ search: "  senior  " }).search
    ).toBe("senior")
  })
})

describe("resumeIdInputSchema", () => {
  it("uuid", () => {
    expect(resumeIdInputSchema.parse({ id: UUID }).id).toBe(UUID)
  })
})

describe("resumeCreateInputSchema", () => {
  it("accepts optional fields", () => {
    const v = resumeCreateInputSchema.parse({
      title: "SWE resume",
      targetRole: "Backend",
      company: null,
      templateId: "technical",
      style,
      document,
      generalScore: 0,
    })
    expect(v.templateId).toBe("technical")
    expect(v.generalScore).toBe(0)
  })

  it("rejects invalid score / empty title", () => {
    expect(() => resumeCreateInputSchema.parse({ generalScore: -1 })).toThrow()
    expect(() => resumeCreateInputSchema.parse({ title: "  " })).toThrow()
  })
})

describe("resumeUpdateInputSchema", () => {
  it("requires id; allows status", () => {
    const v = resumeUpdateInputSchema.parse({
      id: UUID,
      status: "active",
      targetRole: null,
    })
    expect(v.status).toBe("active")
    expect(() => resumeUpdateInputSchema.parse({ status: "active" })).toThrow()
  })
})
