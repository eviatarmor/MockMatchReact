import type {
  DurationBucket,
  InterviewTrack,
  TrackRoleFamily,
} from "../types"

/** Duration buckets for sidebar filters. */
export function durationBucket(durationMin: number): DurationBucket {
  if (durationMin <= 25) return "short"
  if (durationMin <= 35) return "medium"
  return "long"
}

/**
 * Keyword → role-family map. Matched against resume `targetRole` + title.
 * Longer / more specific phrases first so "product manager" wins over "manager".
 */
const ROLE_FAMILY_KEYWORDS: readonly {
  readonly family: TrackRoleFamily
  readonly keywords: readonly string[]
}[] = [
  {
    family: "engineering",
    keywords: [
      "software engineer",
      "staff engineer",
      "principal engineer",
      "full stack",
      "full-stack",
      "fullstack",
      "backend",
      "front end",
      "front-end",
      "frontend",
      "devops",
      "sre",
      "site reliability",
      "platform engineer",
      "security engineer",
      "infrastructure",
      "devops",
      "dev ops",
      "site reliability engineer",
      "sre",
      "machine learning",
      "ml engineer",
      "data engineer",
      "data scientist",
      "mobile engineer",
      "ios engineer",
      "android engineer",
      "swe",
      "developer",
      "engineer",
      "architect",
      "programmer",
    ],
  },
  {
    family: "product",
    keywords: [
      "product manager",
      "product owner",
      "product management",
      "group product",
      "technical product",
      "product lead",
      "product sense",
      "associate product",
      "apm",
      "gpm",
      "pm,",
      "pm ",
      " pm",
    ],
  },
  {
    family: "design",
    keywords: [
      "product designer",
      "ux designer",
      "ui designer",
      "ux/ui",
      "ui/ux",
      "user experience",
      "user research",
      "design lead",
      "visual designer",
      "interaction designer",
      "designer",
    ],
  },
  {
    family: "finance",
    keywords: [
      "quant",
      "quantitative",
      "investment banker",
      "investment banking",
      "private equity",
      "hedge fund",
      "portfolio manager",
      "financial analyst",
      "equity research",
      "trader",
      "trading",
      "finance",
      "fp&a",
      "cfo",
      "accountant",
      "accounting",
    ],
  },
  {
    family: "consulting",
    keywords: [
      "management consultant",
      "strategy consultant",
      "consulting",
      "consultant",
      "mckinsey",
      "bain",
      "bcg",
      "strategy",
    ],
  },
  {
    family: "clinical",
    keywords: [
      "physician",
      "clinician",
      "clinical",
      "resident",
      "surgeon",
      "nurse practitioner",
      "registered nurse",
      "medical doctor",
      "healthcare",
      "pharmacist",
      "doctor",
      "nurse",
      "md ",
      " md",
    ],
  },
]

/**
 * Infer role families from free-text (resume target role / title).
 * Always includes `general` so leadership/comms tracks stay available.
 */
export function inferRoleFamiliesFromText(text: string): TrackRoleFamily[] {
  const normalized = ` ${text.toLowerCase().trim()} `
  if (!normalized.trim()) return []

  const matched = new Set<TrackRoleFamily>()
  for (const { family, keywords } of ROLE_FAMILY_KEYWORDS) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      matched.add(family)
    }
  }

  if (matched.size === 0) return []
  matched.add("general")
  return [...matched]
}

export function isTrackRecommended(
  track: InterviewTrack,
  families: readonly TrackRoleFamily[]
): boolean {
  if (families.length === 0) return false
  return track.roleFamilies.some((f) => families.includes(f))
}

export function collectRoleHintsFromResumes(
  resumes: readonly { title: string; targetRole: string | null }[]
): {
  families: TrackRoleFamily[]
  sourceLabels: string[]
} {
  const familySet = new Set<TrackRoleFamily>()
  const labels: string[] = []
  const labelSeen = new Set<string>()

  for (const resume of resumes) {
    const roleText = resume.targetRole?.trim() || resume.title.trim()
    if (!roleText) continue

    const families = inferRoleFamiliesFromText(roleText)
    if (families.length === 0) continue

    for (const f of families) familySet.add(f)

    const label = resume.targetRole?.trim() || resume.title.trim()
    const key = label.toLowerCase()
    if (!labelSeen.has(key)) {
      labelSeen.add(key)
      labels.push(label)
    }
  }

  return {
    families: [...familySet],
    sourceLabels: labels.slice(0, 3),
  }
}
