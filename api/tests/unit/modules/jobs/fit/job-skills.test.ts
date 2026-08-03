import { describe, expect, it } from "vitest"
import { extractJobRequiredSkills } from "@/modules/jobs/fit/job-skills.js"

describe("extractJobRequiredSkills", () => {
  it("returns empty for blank text", () => {
    expect(extractJobRequiredSkills("")).toEqual([])
    expect(extractJobRequiredSkills("   ")).toEqual([])
  })

  it("extracts known multi-word skills before shorter siblings", () => {
    const skills = extractJobRequiredSkills(
      "We need React Native, TypeScript, and Docker experience."
    )
    const labels = skills.map((s) => s.label)
    expect(labels).toContain("React Native")
    expect(labels).toContain("TypeScript")
    expect(labels).toContain("Docker")
    // React Native span should win over bare React when overlapping
    expect(labels.filter((l) => l === "React" || l === "React Native")).toEqual([
      "React Native",
    ])
  })

  it("marks all extracted skills as unmatched", () => {
    const skills = extractJobRequiredSkills("Python and Kubernetes required.")
    expect(skills.length).toBeGreaterThan(0)
    expect(skills.every((s) => s.matched === false)).toBe(true)
  })

  it("respects max limit", () => {
    const text =
      "TypeScript JavaScript React Python Docker Kubernetes AWS Redis SQL Git"
    expect(extractJobRequiredSkills(text, 3)).toHaveLength(3)
    expect(extractJobRequiredSkills(text, 1)).toHaveLength(1)
  })

  it("falls back to frequent tokens when no known skill matches", () => {
    const skills = extractJobRequiredSkills(
      "bananas bananas bananas mangoes mangoes kiwis"
    )
    expect(skills.length).toBeGreaterThan(0)
    expect(skills[0]!.label).toMatch(/^[A-Z]/)
    expect(skills.every((s) => s.matched === false)).toBe(true)
  })
})
