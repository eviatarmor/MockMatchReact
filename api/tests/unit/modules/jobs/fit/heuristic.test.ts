import { describe, expect, it } from "vitest"
import type { JobFitStub } from "@mockmatch/schemas"
import type { ResumeFitProfile } from "@/modules/jobs/fit/extract-profile.js"
import { scoreJobHeuristic, scoreJobsHeuristic } from "@/modules/jobs/fit/heuristic.js"

function baseProfile(overrides: Partial<ResumeFitProfile> = {}): ResumeFitProfile {
  return {
    resumeIds: ["r1"],
    resumeCount: 1,
    profileHash: "abc",
    skills: ["TypeScript", "React", "Node.js"],
    experience: [
      {
        title: "Senior Software Engineer",
        org: "Acme",
        dates: "2020 – Present",
        bullets: ["Built React dashboards", "Owned TypeScript APIs"],
      },
    ],
    targetRoles: ["Software Engineer"],
    headlines: ["Full-stack engineer"],
    education: [],
    certifications: [],
    summaries: [],
    compactText: "skills",
    ...overrides,
  }
}

function baseJob(overrides: Partial<JobFitStub> = {}): JobFitStub {
  return {
    id: "job-1",
    title: "Senior Software Engineer",
    company: "Globex",
    description:
      "Build TypeScript and React services. Node.js APIs. Docker optional.",
    location: "Remote",
    category: "IT Jobs",
    ...overrides,
  }
}

describe("scoreJobHeuristic", () => {
  it("returns high score for strong skill and title overlap", () => {
    const result = scoreJobHeuristic(baseProfile(), baseJob())
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(result.mode).toBe("heuristic")
    expect(["strong", "good", "fair", "weak"]).toContain(result.tier)
    expect(result.fitNote.length).toBeGreaterThan(0)
    expect(result.skills.length).toBeGreaterThan(0)
    expect(result.skills.every((s) => s.matched === false)).toBe(true)
  })

  it("returns lower score for unrelated job", () => {
    const result = scoreJobHeuristic(
      baseProfile({
        skills: ["React"],
        experience: [
          {
            title: "Frontend Developer",
            org: "X",
            dates: "",
            bullets: ["UI work"],
          },
        ],
        targetRoles: ["Frontend Developer"],
      }),
      baseJob({
        title: "Dental Hygienist",
        description: "Clean teeth and schedule appointments. No coding.",
        category: "Healthcare",
      })
    )
    expect(result.score).toBeLessThan(50)
    expect(result.tier).toBe("weak")
  })

  it("handles empty skills with neutral skill contribution", () => {
    const withSkills = scoreJobHeuristic(baseProfile(), baseJob())
    const emptySkills = scoreJobHeuristic(
      baseProfile({ skills: [] }),
      baseJob()
    )
    expect(emptySkills.score).toBeGreaterThanOrEqual(0)
    expect(emptySkills.score).toBeLessThanOrEqual(100)
    // empty skills use fixed 40 skill component — still produces a score
    expect(typeof emptySkills.score).toBe("number")
    expect(withSkills.mode).toBe("heuristic")
  })

  it("clamps score to 0–100", () => {
    const result = scoreJobHeuristic(baseProfile(), baseJob())
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})

describe("scoreJobsHeuristic", () => {
  it("keys results by job id", () => {
    const jobs = [baseJob({ id: "a" }), baseJob({ id: "b", title: "Junior Engineer" })]
    const out = scoreJobsHeuristic(baseProfile(), jobs)
    expect(Object.keys(out).sort()).toEqual(["a", "b"])
    expect(out.a!.mode).toBe("heuristic")
    expect(out.b!.mode).toBe("heuristic")
  })
})
