import type {
  JobContractType,
  JobEmploymentType,
  JobProviderId,
  JobRemoteType,
  JobSortBy,
  NormalizedJob,
} from "@mockmatch/schemas"

/** Provider-facing country codes (lowercase path segments). */
export type ProviderCountryCode = "us" | "gb" | "au"

export interface JobSearchQuery {
  readonly country: ProviderCountryCode
  readonly query?: string
  readonly where?: string
  readonly page: number
  readonly pageSize: number
  readonly salaryMin?: number
  readonly fullTime?: boolean
  readonly partTime?: boolean
  readonly contract?: boolean
  readonly permanent?: boolean
  readonly sortBy: JobSortBy
  readonly maxDaysOld?: number
  readonly remoteOnly?: boolean
}

export interface ProviderSearchResult {
  readonly items: NormalizedJob[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
  readonly provider: JobProviderId
}

export interface JobProvider {
  readonly id: JobProviderId
  readonly supportedCountries: readonly ProviderCountryCode[]
  search(query: JobSearchQuery): Promise<ProviderSearchResult>
}

export type {
  JobContractType,
  JobEmploymentType,
  JobProviderId,
  JobRemoteType,
  JobSortBy,
  NormalizedJob,
}
