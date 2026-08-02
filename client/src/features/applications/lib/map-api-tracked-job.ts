import type { TrackedJobDto } from "@mockmatch/schemas"
import { formatRelativeTime } from "@/lib/format-relative-time"
import type { TrackedJob, TrackingStatus } from "@/features/discover/types"

function statusFields(status: TrackingStatus): Pick<
  TrackedJob,
  "status" | "progressCompleted" | "activeStepIndex" | "nextStep"
> {
  const progressCompleted =
    status === "saved" || status === "declined"
      ? 0
      : status === "applied"
        ? 1
        : status === "interviewing"
          ? 2
          : 3

  return {
    status,
    progressCompleted,
    activeStepIndex:
      status === "saved" || status === "declined"
        ? null
        : Math.min(progressCompleted, 3),
    nextStep:
      status === "saved"
        ? "Tailor resume & apply"
        : status === "applied"
          ? "Follow up with recruiter"
          : status === "interviewing"
            ? "Prep for next round"
            : status === "declined"
              ? "Learn from feedback"
              : "Review offer details",
  }
}

/** Map API DTO → client TrackedJob (derived progress / next step). */
export function mapApiTrackedJob(dto: TrackedJobDto): TrackedJob {
  const fields = statusFields(dto.status)
  return {
    id: dto.id,
    sourceKey: dto.sourceKey,
    title: dto.title,
    company: dto.company,
    location: dto.location,
    avatarText: dto.avatarText,
    avatarColorClass: dto.avatarColorClass,
    ...fields,
    nextStepDate: dto.nextStepDate,
    matchScore: dto.matchScore,
    matchTier: dto.matchTier,
    salaryRange: dto.salaryRange,
    seniority: dto.seniority,
    postedAt: dto.postedAt,
    progressSteps: 4,
    statusUpdatedAt: formatRelativeTime(dto.updatedAt),
    applyUrl: dto.applyUrl ?? undefined,
    description: dto.description ?? undefined,
    provider: dto.provider || undefined,
  }
}

export function trackedJobToUpsertInput(job: {
  sourceKey: string
  provider?: string
  title: string
  company: string
  location: string
  description?: string
  applyUrl?: string
  status: TrackingStatus
  salaryRange: string
  seniority: TrackedJob["seniority"]
  matchScore: number
  matchTier: TrackedJob["matchTier"]
  avatarText: string
  avatarColorClass: string
  postedAt: string
  nextStepDate?: string | null
  /** Discover apply / Import job → auto question bank generation. */
  generateQuestions?: boolean
}) {
  const externalId =
    job.sourceKey.includes(":") && job.provider
      ? job.sourceKey.slice(job.sourceKey.indexOf(":") + 1)
      : null

  return {
    sourceKey: job.sourceKey,
    provider: job.provider || "manual",
    externalId,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description ?? null,
    applyUrl: job.applyUrl ?? null,
    status: job.status,
    salaryRange: job.salaryRange,
    seniority: job.seniority,
    matchScore: job.matchScore,
    matchTier: job.matchTier,
    avatarText: job.avatarText,
    avatarColorClass: job.avatarColorClass,
    postedAt: job.postedAt,
    nextStepDate: job.nextStepDate ?? null,
    generateQuestions: job.generateQuestions ?? false,
  }
}
