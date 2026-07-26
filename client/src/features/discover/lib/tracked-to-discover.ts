import type { DiscoverJob, TrackedJob } from "../types"

/** Best-effort DiscoverJob from a tracked board row (paste / cold cache). */
export function trackedJobToDiscover(job: TrackedJob): DiscoverJob {
  return {
    id: job.id,
    provider: job.provider ?? "tracked",
    title: job.title,
    company: job.company,
    avatarText: job.avatarText,
    avatarColorClass: job.avatarColorClass,
    isNew: false,
    location: job.location,
    remoteType: "unknown",
    salaryRange: job.salaryRange,
    salaryMin: null,
    salaryMax: null,
    seniority: job.seniority,
    employmentType: "unknown",
    postedAt: job.postedAt,
    postedAtIso: "",
    description: job.description ?? "",
    applyUrl: job.applyUrl ?? "",
    category: null,
    matchScore: job.matchScore > 0 ? job.matchScore : undefined,
    matchTier: job.matchTier,
  }
}
