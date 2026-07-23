import type { FitScore, JobFitStub } from "@mockmatch/schemas"
import type { ResumeFitProfile } from "./extract-profile.js"

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

function tierFromScore(score: number): FitScore["tier"] {
  if (score >= 85) return "strong"
  if (score >= 70) return "good"
  return "fair"
}

function skillMatches(
  profileSkills: string[],
  jobText: string
): Array<{ label: string; matched: boolean }> {
  const jobNorm = normalize(jobText)
  const jobTokens = tokenSet(jobText)
  const matched: string[] = []
  const unmatched: string[] = []

  for (const skill of profileSkills) {
    const sn = normalize(skill)
    if (!sn) continue
    const skillTokens = tokenSet(skill)
    const multi = sn.length >= 3 && jobNorm.includes(sn)
    let overlap = 0
    for (const t of skillTokens) {
      if (jobTokens.has(t)) overlap++
    }
    const hit = multi || (skillTokens.size > 0 && overlap / skillTokens.size >= 0.6)
    if (hit) matched.push(skill)
    else unmatched.push(skill)
  }

  // Prefer matched first, then a few unmatched for gap signal
  const tags: Array<{ label: string; matched: boolean }> = []
  for (const label of matched.slice(0, 4)) {
    tags.push({ label, matched: true })
  }
  for (const label of unmatched.slice(0, Math.max(0, 4 - tags.length))) {
    tags.push({ label, matched: false })
  }

  // If no profile skills, mine simple job keywords
  if (tags.length === 0) {
    const stop = new Set([
      "and",
      "the",
      "for",
      "with",
      "you",
      "our",
      "will",
      "are",
      "job",
      "role",
      "work",
      "team",
      "years",
      "experience",
    ])
    const freq = new Map<string, number>()
    for (const t of tokens(jobText)) {
      if (stop.has(t) || t.length < 3) continue
      freq.set(t, (freq.get(t) ?? 0) + 1)
    }
    const top = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([w]) => w)
    for (const label of top) {
      tags.push({ label, matched: false })
    }
  }

  return tags
}

function buildFitNote(
  score: number,
  matchedSkills: string[],
  titleHit: boolean
): string {
  if (score >= 85) {
    const skills = matchedSkills.slice(0, 3).join(", ")
    return skills
      ? `Strong skill overlap (${skills}).`
      : "Strong overall alignment with your background."
  }
  if (score >= 70) {
    return titleHit
      ? "Good role match; some skill gaps to cover."
      : "Solid skill overlap with partial role alignment."
  }
  if (matchedSkills.length > 0) {
    return `Limited overlap — matched ${matchedSkills.slice(0, 2).join(", ")}.`
  }
  return "Limited skill overlap with this role."
}

/**
 * Free deterministic fit. Uses multi-resume skills + experience + target roles.
 */
export function scoreJobHeuristic(
  profile: ResumeFitProfile,
  job: JobFitStub
): FitScore {
  const jobBlob = [job.title, job.company, job.category ?? "", job.description, job.location ?? ""]
    .join(" ")
  const jobTokens = tokenSet(jobBlob)
  const titleTokens = tokenSet(job.title)

  // Skill overlap
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

  const skills = skillMatches(profile.skills, jobBlob)
  const matchedLabels = skills.filter((s) => s.matched).map((s) => s.label)

  return {
    score,
    tier: tierFromScore(score),
    fitNote: buildFitNote(score, matchedLabels.length ? matchedLabels : skillHits, titleContains || titleJ > 0.2),
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
