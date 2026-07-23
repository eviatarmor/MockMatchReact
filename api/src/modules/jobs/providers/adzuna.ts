import { TRPCError } from "@trpc/server"
import type {
  JobContractType,
  JobEmploymentType,
  JobRemoteType,
  NormalizedJob,
} from "@mockmatch/schemas"
import { env } from "../../../config/env.js"
import { logger } from "../../../lib/logger.js"
import type {
  JobProvider,
  JobSearchQuery,
  ProviderCountryCode,
  ProviderSearchResult,
} from "./types.js"

const ADZUNA_BASE = "https://api.adzuna.com/v1/api"
/** Adzuna is often slow from some regions; 8s was aborting healthy calls. */
const FETCH_TIMEOUT_MS = 20_000
/** One retry on timeout/transient network only. */
const FETCH_MAX_ATTEMPTS = 2

const CURRENCY_BY_COUNTRY: Record<ProviderCountryCode, string> = {
  us: "USD",
  gb: "GBP",
  au: "AUD",
}

interface AdzunaLocation {
  display_name?: string
  area?: string[]
}

interface AdzunaCompany {
  display_name?: string
}

interface AdzunaCategory {
  label?: string
  tag?: string
}

interface AdzunaJob {
  id?: string | number
  title?: string
  description?: string
  created?: string
  redirect_url?: string
  salary_min?: number
  salary_max?: number
  salary_is_predicted?: number | string | boolean
  latitude?: number
  longitude?: number
  contract_time?: string
  contract_type?: string
  company?: AdzunaCompany
  location?: AdzunaLocation
  category?: AdzunaCategory
}

interface AdzunaSearchResponse {
  count?: number
  results?: AdzunaJob[]
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function isPredicted(value: AdzunaJob["salary_is_predicted"]): boolean {
  return value === 1 || value === "1" || value === true
}

function inferRemoteType(location: string, description: string): JobRemoteType {
  const hay = `${location} ${description}`.toLowerCase()
  if (/\bremote\b/.test(hay) || /\bwork from home\b/.test(hay) || /\bwfh\b/.test(hay)) {
    return "remote"
  }
  if (/\bhybrid\b/.test(hay)) {
    return "hybrid"
  }
  if (location.trim().length > 0) {
    return "onsite"
  }
  return "unknown"
}

function inferEmploymentType(
  contractTime: string | undefined,
  contractType: string | undefined
): JobEmploymentType {
  const time = (contractTime ?? "").toLowerCase()
  const type = (contractType ?? "").toLowerCase()
  if (time.includes("part")) return "partTime"
  if (time.includes("full")) return "fullTime"
  if (type.includes("contract") || type.includes("temporary")) return "contract"
  if (type.includes("intern")) return "internship"
  if (type.includes("permanent")) return "fullTime"
  return "unknown"
}

function inferContractType(contractType: string | undefined): JobContractType {
  const type = (contractType ?? "").toLowerCase()
  if (type.includes("permanent")) return "permanent"
  if (type.includes("contract") || type.includes("temporary")) return "contract"
  return "unknown"
}

function mapJob(raw: AdzunaJob, country: ProviderCountryCode): NormalizedJob | null {
  const externalId = raw.id != null ? String(raw.id) : ""
  if (!externalId) return null

  const title = stripHtml(raw.title ?? "").trim()
  if (!title) return null

  const company = (raw.company?.display_name ?? "").trim() || "Unknown company"
  const location = (raw.location?.display_name ?? "").trim() || "—"
  const description = stripHtml(raw.description ?? "")
  const applyUrl = (raw.redirect_url ?? "").trim()
  const salaryMin =
    typeof raw.salary_min === "number" && Number.isFinite(raw.salary_min)
      ? raw.salary_min
      : null
  const salaryMax =
    typeof raw.salary_max === "number" && Number.isFinite(raw.salary_max)
      ? raw.salary_max
      : null

  return {
    id: `adzuna:${externalId}`,
    provider: "adzuna",
    externalId,
    title,
    company,
    location,
    description,
    applyUrl,
    salaryMin,
    salaryMax,
    salaryIsPredicted: isPredicted(raw.salary_is_predicted),
    currencyHint: CURRENCY_BY_COUNTRY[country],
    employmentType: inferEmploymentType(raw.contract_time, raw.contract_type),
    contractType: inferContractType(raw.contract_type),
    remoteType: inferRemoteType(location, description),
    postedAt: raw.created ?? new Date().toISOString(),
    category: raw.category?.label?.trim() || null,
    latitude: typeof raw.latitude === "number" ? raw.latitude : null,
    longitude: typeof raw.longitude === "number" ? raw.longitude : null,
  }
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = "name" in error ? String(error.name) : ""
  return name === "AbortError" || name === "TimeoutError"
}

async function fetchAdzunaOnce(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchAdzuna(
  url: string,
  meta: { country: string; page: number }
): Promise<Response> {
  let lastError: unknown

  for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetchAdzunaOnce(url)
      if (!response.ok) {
        // Retry only transient upstream errors
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < FETCH_MAX_ATTEMPTS
        ) {
          logger.warn(
            { status: response.status, attempt, ...meta },
            "adzuna transient error — retrying"
          )
          await new Promise((r) => setTimeout(r, 400 * attempt))
          continue
        }
        logger.warn({ status: response.status, ...meta }, "adzuna non-ok response")
        throw new TRPCError({
          code: response.status === 429 ? "TOO_MANY_REQUESTS" : "BAD_GATEWAY",
          message:
            response.status === 429
              ? "Job search rate limit hit. Try again shortly."
              : "Job search provider returned an error.",
        })
      }
      return response
    } catch (error) {
      if (error instanceof TRPCError) throw error
      lastError = error
      const aborted = isAbortError(error)
      if (attempt < FETCH_MAX_ATTEMPTS) {
        logger.warn(
          { err: error, aborted, attempt, ...meta },
          "adzuna fetch failed — retrying"
        )
        await new Promise((r) => setTimeout(r, 400 * attempt))
        continue
      }
      logger.error({ err: error, aborted, attempt, ...meta }, "adzuna fetch failed")
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: aborted
          ? "Job search timed out. Try again."
          : "Could not reach job search provider.",
      })
    }
  }

  logger.error({ err: lastError, ...meta }, "adzuna fetch exhausted retries")
  throw new TRPCError({
    code: "BAD_GATEWAY",
    message: "Could not reach job search provider.",
  })
}

function buildSearchParams(query: JobSearchQuery, appId: string, appKey: string): URLSearchParams {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(query.pageSize),
    "content-type": "application/json",
  })

  const what = query.query?.trim()
  if (what) params.set("what", what)

  let where = query.where?.trim() ?? ""
  if (query.remoteOnly) {
    // Adzuna has no first-class remote flag — bias location + keyword.
    if (!where) where = "Remote"
    const existing = params.get("what")
    if (existing) {
      if (!/\bremote\b/i.test(existing)) params.set("what", `${existing} remote`)
    } else {
      params.set("what", "remote")
    }
  }
  if (where) params.set("where", where)

  if (query.salaryMin != null && query.salaryMin > 0) {
    params.set("salary_min", String(query.salaryMin))
  }
  if (query.fullTime) params.set("full_time", "1")
  if (query.partTime) params.set("part_time", "1")
  if (query.contract) params.set("contract", "1")
  if (query.permanent) params.set("permanent", "1")
  if (query.maxDaysOld != null) params.set("max_days_old", String(query.maxDaysOld))

  if (query.sortBy === "date") params.set("sort_by", "date")
  else if (query.sortBy === "salary") params.set("sort_by", "salary")
  // relevance = Adzuna default (omit sort_by)

  return params
}

export class AdzunaProvider implements JobProvider {
  readonly id = "adzuna" as const
  readonly supportedCountries = ["us", "gb", "au"] as const

  isConfigured(): boolean {
    return env.ADZUNA_APP_ID !== "" && env.ADZUNA_APP_KEY !== ""
  }

  async search(query: JobSearchQuery): Promise<ProviderSearchResult> {
    if (!this.isConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Job search is not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY.",
      })
    }

    if (!this.supportedCountries.includes(query.country)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Adzuna does not support country "${query.country}".`,
      })
    }

    const params = buildSearchParams(query, env.ADZUNA_APP_ID, env.ADZUNA_APP_KEY)
    const url = `${ADZUNA_BASE}/jobs/${query.country}/search/${query.page}?${params.toString()}`

    const response = await fetchAdzuna(url, {
      country: query.country,
      page: query.page,
    })

    let body: AdzunaSearchResponse
    try {
      body = (await response.json()) as AdzunaSearchResponse
    } catch (error) {
      logger.error({ err: error }, "adzuna json parse failed")
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "Job search provider returned invalid data.",
      })
    }

    const items = (body.results ?? [])
      .map((raw) => mapJob(raw, query.country))
      .filter((job): job is NormalizedJob => job != null)

    // Soft post-filter for remote when provider still mixes onsite
    const filtered = query.remoteOnly
      ? items.filter((job) => job.remoteType === "remote" || job.remoteType === "hybrid")
      : items

    return {
      items: filtered,
      total: typeof body.count === "number" ? body.count : filtered.length,
      page: query.page,
      pageSize: query.pageSize,
      provider: "adzuna",
    }
  }
}

export const adzunaProvider = new AdzunaProvider()
