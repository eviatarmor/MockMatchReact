import { avatarClassFor, titleToAvatarText } from "@/lib/title-avatar"
import type {
  DiscoverJob,
  MatchTier,
  TrackedJob,
} from "@/features/discover/types"

function tierFromScore(score: number | undefined): MatchTier {
  if (score == null || score <= 0) return "weak"
  if (score >= 85) return "strong"
  if (score >= 75) return "good"
  if (score >= 60) return "fair"
  return "weak"
}

export function discoverJobToTracked(job: DiscoverJob): TrackedJob {
  const matchScore = job.matchScore ?? 0
  return {
    id: job.id,
    sourceKey: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    avatarText: job.avatarText,
    avatarColorClass: job.avatarColorClass,
    status: "saved",
    nextStep: "Tailor resume & apply",
    nextStepDate: "no date",
    matchScore,
    matchTier: job.matchTier ?? tierFromScore(matchScore),
    salaryRange: job.salaryRange,
    seniority: job.seniority,
    postedAt: job.postedAt,
    progressSteps: 4,
    progressCompleted: 0,
    activeStepIndex: null,
    statusUpdatedAt: "Saved just now",
    applyUrl: job.applyUrl || undefined,
    description: job.description || undefined,
    provider: job.provider || undefined,
  }
}

/**
 * Best-effort parse of a pasted job description into a Saved tracked job.
 * First non-empty line → title; optional "at Company" / second line → company.
 */
export function parseJobDescriptionToTracked(raw: string): TrackedJob {
  const text = raw.trim()
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  let title = lines[0] || "Untitled role"
  let company = "Unknown company"

  const atMatch = title.match(/^(.+?)\s+at\s+(.+)$/i)
  if (atMatch) {
    title = atMatch[1]!.trim()
    company = atMatch[2]!.trim()
  } else if (lines[1] && lines[1].length < 80 && !/[.!?]$/.test(lines[1])) {
    company = lines[1]
  } else {
    const companyLine = lines.find((line) =>
      /^(company|employer)\s*[:—-]\s*(.+)$/i.test(line)
    )
    if (companyLine) {
      const m = companyLine.match(/^(?:company|employer)\s*[:—-]\s*(.+)$/i)
      if (m?.[1]) company = m[1].trim()
    }
  }

  const locationLine = lines.find((line) =>
    /^(location|where)\s*[:—-]\s*(.+)$/i.test(line)
  )
  let location = "—"
  if (locationLine) {
    const m = locationLine.match(/^(?:location|where)\s*[:—-]\s*(.+)$/i)
    if (m?.[1]) location = m[1].trim()
  }

  const id = `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const avatarSeed = company !== "Unknown company" ? company : title

  return {
    id,
    sourceKey: id,
    title,
    company,
    location,
    avatarText: titleToAvatarText(avatarSeed),
    avatarColorClass: avatarClassFor(avatarSeed),
    status: "saved",
    nextStep: "Tailor resume & apply",
    nextStepDate: "no date",
    matchScore: 0,
    matchTier: "weak",
    salaryRange: "—",
    seniority: "unknown",
    postedAt: "Just now",
    progressSteps: 4,
    progressCompleted: 0,
    activeStepIndex: null,
    statusUpdatedAt: "Saved just now",
    description: text || undefined,
    provider: "import",
  }
}
