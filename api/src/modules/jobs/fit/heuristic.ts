import type { FitScore, JobFitStub } from "@mockmatch/schemas"
import type { ResumeFitProfile } from "./extract-profile.js"
import { extractJobRequiredSkills } from "./job-skills.js"
import { tierFromScore } from "./tier.js"

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length >= 2)
}

function stemLight(token: string): string {
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`
  if (token.endsWith("ing") && token.length > 5) return token.slice(0, -3)
  if (token.endsWith("ed") && token.length > 4) return token.slice(0, -2)
  if (token.endsWith("s") && token.length > 3 && !token.endsWith("ss")) {
    return token.slice(0, -1)
  }
  return token
}

function tokenSet(text: string): Set<string> {
  return new Set(tokens(text).map(stemLight))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) {
    if (b.has(t)) inter++
  }
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

type Seniority = "junior" | "mid" | "senior" | "staff" | "unknown"

function inferSeniority(title: string): Seniority {
  const t = title.toLowerCase()
  if (/\b(intern|junior|jr\.?|entry)\b/.test(t)) return "junior"
  if (/\b(staff|principal|distinguished|fellow)\b/.test(t)) return "staff"
  if (/\b(senior|sr\.?|lead|manager|director|head)\b/.test(t)) return "senior"
  if (/\b(mid|intermediate)\b/.test(t)) return "mid"
  return "unknown"
}

const SENIORITY_RANK: Record<Seniority, number> = {
  junior: 1,
  mid: 2,
  senior: 3,
  staff: 4,
  unknown: 2,
}

function buildFitNote(
  score: number,
  matchedSkills: string[],
  titleHit: boolean
): string {
  if (score >= 80) {
    const skills = matchedSkills.slice(0, 3).join(", ")
    return skills
      ? `Strong skill overlap (${skills}).`
      : "Strong overall alignment with your background."
  }
  if (score >= 60) {
    return titleHit
      ? "Good role match; some skill gaps to cover."
      : "Solid skill overlap with partial role alignment."
  }
  if (score >= 40) {
    if (matchedSkills.length > 0) {
      return `Partial overlap — matched ${matchedSkills.slice(0, 2).join(", ")}.`
    }
    return "Fair skill overlap with this role."
  }
  if (matchedSkills.length > 0) {
    return `Low overlap — only matched ${matchedSkills.slice(0, 2).join(", ")}.`
  }
  return "Weak skill overlap with this role."
}

/**
 * Free deterministic fit. Uses multi-resume skills + experience + target roles.
 * Skills list = what the *job* requires (not resume gap tags).
 */
export function scoreJobHeuristic(
  profile: ResumeFitProfile,
  job: JobFitStub
): FitScore {
  const jobBlob = [job.title, job.company, job.category ?? "", job.description, job.location ?? ""]
    .join(" ")
  const jobTokens = tokenSet(jobBlob)
  const titleTokens = tokenSet(job.title)

  // Skill overlap (for score only)
  const skillHits: string[] = []
  let skillHitCount = 0
  for (const skill of profile.skills) {
    const st = tokenSet(skill)
    if (st.size === 0) continue
    let hit = 0
    for (const t of st) {
      if (jobTokens.has(t)) hit++
    }
    if (hit / st.size >= 0.5 || normalize(jobBlob).includes(normalize(skill))) {
      skillHitCount++
      skillHits.push(skill)
    }
  }
  const skillScore =
    profile.skills.length === 0
      ? 40
      : Math.min(100, Math.round((skillHitCount / Math.min(profile.skills.length, 20)) * 100))

  // Title / target role
  const roleCorpus = [
    ...profile.targetRoles,
    ...profile.headlines,
    ...profile.experience.map((r) => r.title),
  ].join(" ")
  const roleTokens = tokenSet(roleCorpus)
  const titleJ = jaccard(roleTokens, titleTokens)
  const titleContains = profile.targetRoles.some((r) =>
    normalize(job.title).includes(normalize(r))
  ) || profile.experience.some((r) => {
    const tn = normalize(r.title)
    return tn.length >= 4 && normalize(job.title).includes(tn)
  })
  const titleScore = Math.round(Math.min(100, titleJ * 100 * 1.4 + (titleContains ? 25 : 0)))

  // Experience keyword overlap
  const expText = profile.experience
    .flatMap((r) => [r.title, ...r.bullets])
    .join(" ")
  const expScore = Math.round(jaccard(tokenSet(expText), jobTokens) * 100)

  // Seniority
  const jobSen = inferSeniority(job.title)
  const profileSens = profile.experience.map((r) => inferSeniority(r.title))
  const bestProfile =
    profileSens.length === 0
      ? "unknown"
      : profileSens.reduce((a, b) =>
          SENIORITY_RANK[a] >= SENIORITY_RANK[b] ? a : b
        )
  const delta = Math.abs(SENIORITY_RANK[jobSen] - SENIORITY_RANK[bestProfile])
  const seniorityScore = delta === 0 ? 100 : delta === 1 ? 75 : delta === 2 ? 50 : 30

  // Weighted blend
  const raw =
    skillScore * 0.45 +
    titleScore * 0.25 +
    expScore * 0.2 +
    seniorityScore * 0.1
  const score = Math.max(0, Math.min(100, Math.round(raw)))

  // Job-required skills for UI (not matched/unmatched resume tags)
  const skills = extractJobRequiredSkills(jobBlob, 6)

  return {
    score,
    tier: tierFromScore(score),
    fitNote: buildFitNote(
      score,
      skillHits,
      titleContains || titleJ > 0.2
    ),
    skills,
    mode: "heuristic",
  }
}

export function scoreJobsHeuristic(
  profile: ResumeFitProfile,
  jobs: JobFitStub[]
): Record<string, FitScore> {
  const out: Record<string, FitScore> = {}
  for (const job of jobs) {
    out[job.id] = scoreJobHeuristic(profile, job)
  }
  return out
}
