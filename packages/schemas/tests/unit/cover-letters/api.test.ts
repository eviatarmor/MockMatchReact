import { describe, expect, it } from "vitest"
import {
  coverLetterCreateInputSchema,
  coverLetterIdInputSchema,
  coverLetterListInputSchema,
  coverLetterUpdateInputSchema,
} from "@/cover-letters/api.js"

const UUID = "550e8400-e29b-41d4-a716-446655440000"

const style = {
  accent: "blue" as const,
  typeface: "geist" as const,
  heading: "accent" as const,
  density: "normal" as const,
}

const document = {
  sender: { name: "Ada", title: "Eng", contacts: [] },
  date: "1 Jan 2026",
  recipient: { company: "Acme" },
  blocks: [],
}

describe("coverLetterListInputSchema", () => {
  it("pagination defaults", () => {
    const v = coverLetterListInputSchema.parse({})
    expect(v.page).toBe(1)
    expect(v.pageSize).toBe(10)
  })
})

describe("coverLetterIdInputSchema", () => {
  it("uuid only", () => {
    expect(coverLetterIdInputSchema.parse({ id: UUID }).id).toBe(UUID)
    expect(() => coverLetterIdInputSchema.parse({ id: "x" })).toThrow()
  })
})

describe("coverLetterCreateInputSchema", () => {
  it("all optional", () => {
    expect(coverLetterCreateInputSchema.parse({})).toEqual({})
  })

  it("accepts full create", () => {
    const v = coverLetterCreateInputSchema.parse({
      title: " Acme letter ",
      company: "Acme",
      templateId: "classic",
      style,
      document,
      generalScore: 72,
    })
    expect(v.title).toBe("Acme letter")
    expect(v.generalScore).toBe(72)
  })

  it("rejects score out of range / bad template", () => {
    expect(() =>
      coverLetterCreateInputSchema.parse({ generalScore: 101 })
    ).toThrow()
    expect(() =>
      coverLetterCreateInputSchema.parse({ templateId: "neon" })
    ).toThrow()
  })
})

describe("coverLetterUpdateInputSchema", () => {
  it("requires id", () => {
    expect(() => coverLetterUpdateInputSchema.parse({})).toThrow()
    const v = coverLetterUpdateInputSchema.parse({
      id: UUID,
      status: "archived",
      company: null,
    })
    expect(v.status).toBe("archived")
    expect(v.company).toBeNull()
  })
})
