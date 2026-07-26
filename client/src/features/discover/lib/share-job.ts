import type { DiscoverJob } from "../types"
import { jobDetailPath } from "./job-snapshot"

/** Human-readable job blurb for clipboard / messengers. */
export function formatJobShareText(job: DiscoverJob, pageUrl?: string): string {
  const lines = [
    `${job.title} at ${job.company}`,
    [job.location, job.salaryRange]
      .filter((part) => part && part !== "—")
      .join(" · "),
  ].filter(Boolean)

  if (job.description?.trim()) {
    const snippet = job.description.replace(/\s+/g, " ").trim()
    lines.push("")
    lines.push(
      snippet.length > 400 ? `${snippet.slice(0, 397).trimEnd()}…` : snippet
    )
  }

  if (job.applyUrl) {
    lines.push("")
    lines.push(`Apply: ${job.applyUrl}`)
  }

  if (pageUrl) {
    lines.push("")
    lines.push(pageUrl)
  }

  return lines.join("\n")
}

export function jobPageAbsoluteUrl(jobId: string): string {
  if (typeof window === "undefined") return jobDetailPath(jobId)
  return `${window.location.origin}${jobDetailPath(jobId)}`
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function telegramShareUrl(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
}
