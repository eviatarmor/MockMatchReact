import type {
  Country,
  JobEmploymentType,
  JobSearchInput,
  JobSearchResult,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import { getAccount } from "../account/service.js"
import {
  buildJobsCacheKey,
  getCachedJobSearch,
  setCachedJobSearch,
} from "./cache.js"
import { getJobProvider } from "./providers/registry.js"
import type { JobSearchQuery, ProviderCountryCode } from "./providers/types.js"

const COUNTRY_TO_PROVIDER: Record<Country, ProviderCountryCode> = {
  US: "us",
  GB: "gb",
  AU: "au",
}

const PROVIDER_TO_COUNTRY: Record<ProviderCountryCode, Country> = {
  us: "US",
  gb: "GB",
  au: "AU",
}

function employmentFlags(types: JobEmploymentType[] | undefined): {
  fullTime?: boolean
  partTime?: boolean
  contract?: boolean
  permanent?: boolean
} {
  if (!types || types.length === 0) return {}

  const set = new Set(types)
  const flags: {
    fullTime?: boolean
    partTime?: boolean
    contract?: boolean
    permanent?: boolean
  } = {}

  if (set.has("fullTime")) {
    flags.fullTime = true
    flags.permanent = true
  }
  if (set.has("partTime")) flags.partTime = true
  if (set.has("contract")) flags.contract = true
  // internship has no dedicated Adzuna flag — left to keyword search if needed

  return flags
}

function toProviderQuery(
  input: JobSearchInput,
  country: Country
): JobSearchQuery {
  const flags = employmentFlags(input.employmentTypes)
  const page = input.cursor ?? 1
  return {
    country: COUNTRY_TO_PROVIDER[country],
    query: input.query?.trim() || undefined,
    where: input.where?.trim() || undefined,
    page,
    pageSize: input.pageSize,
    salaryMin: input.salaryMin && input.salaryMin > 0 ? input.salaryMin : undefined,
    ...flags,
    sortBy: input.sortBy,
    maxDaysOld: input.maxDaysOld,
    remoteOnly: input.remoteOnly === true ? true : undefined,
  }
}

function stableCachePayload(query: JobSearchQuery): Record<string, unknown> {
  return {
    country: query.country,
    query: query.query ?? "",
    where: query.where ?? "",
    page: query.page,
    pageSize: query.pageSize,
    salaryMin: query.salaryMin ?? 0,
    fullTime: query.fullTime ?? false,
    partTime: query.partTime ?? false,
    contract: query.contract ?? false,
    permanent: query.permanent ?? false,
    sortBy: query.sortBy,
    maxDaysOld: query.maxDaysOld ?? 0,
    remoteOnly: query.remoteOnly ?? false,
  }
}

export async function searchJobs(
  db: Database,
  userId: string,
  input: JobSearchInput
): Promise<JobSearchResult> {
  // Prefer client-supplied country (from prefs) to skip a DB read on every page.
  let country: Country = input.country ?? "US"
  if (!input.country) {
    const account = await getAccount(db, userId)
    country = account.preferences.country
  }
  const provider = getJobProvider(input.provider)
  const query = toProviderQuery(input, country)

  const cacheKey = buildJobsCacheKey(provider.id, stableCachePayload(query))
  const cached = await getCachedJobSearch(cacheKey)
  if (cached) {
    return { ...cached, cached: true }
  }

  const result = await provider.search(query)

  const dto: JobSearchResult = {
    items: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    provider: result.provider,
    cached: false,
    country: PROVIDER_TO_COUNTRY[query.country],
    where: query.where ?? null,
  }

  await setCachedJobSearch(cacheKey, dto)
  return dto
}
