import type { DiscoverJob } from "../types"

const STORAGE_PREFIX = "mm.jobSnapshot."

/** Persist a discover job so `/discover/jobs/:id` survives refresh. */
export function cacheJobSnapshot(job: DiscoverJob): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}${job.id}`,
      JSON.stringify(job)
    )
  } catch {
    // quota / private mode — navigation state still works
  }
}

export function readJobSnapshot(jobId: string): DiscoverJob | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${jobId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DiscoverJob
    if (!parsed || typeof parsed !== "object" || parsed.id !== jobId) return null
    return parsed
  } catch {
    return null
  }
}

export function jobDetailPath(jobId: string): string {
  return `/discover/jobs/${encodeURIComponent(jobId)}`
}
