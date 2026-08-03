import { describe, expect, it } from "vitest"
import { filterSuggestions, getSkillOptions } from "@/lib/onet/index"

describe("filterSuggestions", () => {
  const options = [
    "JavaScript",
    "Java",
    "TypeScript",
    "Python",
    "Scripting",
    "React",
  ]

  it("returns first N options when query is empty", () => {
    expect(filterSuggestions(options, "", 3)).toEqual([
      "JavaScript",
      "Java",
      "TypeScript",
    ])
    expect(filterSuggestions(options, "   ", 2)).toEqual([
      "JavaScript",
      "Java",
    ])
  })

  it("ranks starts-with ahead of contains", () => {
    expect(filterSuggestions(options, "script", 10)).toEqual([
      "Scripting",
      "JavaScript",
      "TypeScript",
    ])
  })

  it("is case-insensitive and respects limit", () => {
    expect(filterSuggestions(options, "JA", 1)).toEqual(["JavaScript"])
    expect(filterSuggestions(options, "ja", 2)).toEqual([
      "JavaScript",
      "Java",
    ])
  })

  it("returns empty when nothing matches", () => {
    expect(filterSuggestions(options, "zzzz")).toEqual([])
  })

  it("works against live skill options catalog", () => {
    const skills = getSkillOptions()
    expect(skills.length).toBeGreaterThan(10)
    const hits = filterSuggestions(skills, "python", 5)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((s) => s.toLowerCase().includes("python"))).toBe(true)
  })
})
