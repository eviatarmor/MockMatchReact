import type { NormalizedJob } from "@mockmatch/schemas"
import { avatarClassFor, titleToAvatarText } from "@/lib/title-avatar"
import { formatRelativeTime } from "@/lib/format-relative-time"
import type { DiscoverJob, EmploymentType, RemoteType, SeniorityLevel } from "../types"

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  GBP: "£",
  AUD: "A$",
}

function formatSalaryAmount(value: number, currencyHint: string | null): string {
  const symbol = (currencyHint && CURRENCY_SYMBOL[currencyHint]) || "$"
  if (value >= 1000) {
    const k = Math.round(value / 1000)
    return `${symbol}${k}K`
  }
  return `${symbol}${Math.round(value).toLocaleString()}`
}

export function formatSalaryRange(
  min: number | null,
  max: number | null,
  currencyHint: string | null,
  isPredicted: boolean
): string {
  if (min == null && max == null) return "—"
  let range: string
  if (min != null && max != null) {
    range = `${formatSalaryAmount(min, currencyHint)} – ${formatSalaryAmount(max, currencyHint)}`
  } else if (min != null) {
    range = `${formatSalaryAmount(min, currencyHint)}+`
  } else {
    range = `Up to ${formatSalaryAmount(max!, currencyHint)}`
  }
  return isPredicted ? `~${range}` : range
}

function inferSeniority(title: string): SeniorityLevel {
  const t = title.toLowerCase()
  if (/\bstaff\b/.test(t)) return "staff"
  if (/\blead\b/.test(t) || /\bprincipal\b/.test(t) || /\bmanager\b/.test(t)) return "lead"
  if (/\bsenior\b/.test(t) || /\bsr\.?\b/.test(t)) return "senior"
  return "unknown"
}

function isNewListing(iso: string, now = Date.now()): boolean {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return false
  return now - then <= 3 * 24 * 60 * 60 * 1000
}

function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

export function mapNormalizedJobToDiscover(job: NormalizedJob): DiscoverJob {
  const avatarSeed = job.company || job.title
  return {
    id: job.id,
    provider: job.provider,
    title: job.title,
    company: job.company,
    avatarText: titleToAvatarText(job.company || job.title),
    avatarColorClass: avatarClassFor(avatarSeed),
    isNew: isNewListing(job.postedAt),
    location: job.location,
    remoteType: job.remoteType as RemoteType,
    salaryRange: formatSalaryRange(
      job.salaryMin,
      job.salaryMax,
      job.currencyHint,
      job.salaryIsPredicted
    ),
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    seniority: inferSeniority(job.title),
    employmentType: job.employmentType as EmploymentType,
    postedAt: formatRelativeTime(job.postedAt),
    postedAtIso: job.postedAt,
    description: job.description,
    applyUrl: job.applyUrl,
    category: job.category,
    fitNote: job.description ? clampDescription(job.description) : undefined,
  }
}
