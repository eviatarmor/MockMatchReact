import { z } from "zod"
import { countrySchema } from "../account/preferences.js"

export const jobProviderIdSchema = z.enum(["adzuna"])

export const jobEmploymentTypeSchema = z.enum([
  "fullTime",
  "partTime",
  "contract",
  "internship",
  "unknown",
])

export const jobContractTypeSchema = z.enum(["permanent", "contract", "unknown"])

export const jobRemoteTypeSchema = z.enum([
  "remote",
  "hybrid",
  "onsite",
  "unknown",
])

export const jobSortBySchema = z.enum(["relevance", "date", "salary"])

export const jobSearchInputSchema = z.object({
  /** Keywords (`what`). Empty/omit → browse by location/country. */
  query: z.string().trim().max(200).optional(),
  /**
   * Account country ISO (`US`/`AU`/`GB`). Server maps to provider country codes.
   * Omit to use the authenticated user's preference.
   */
  country: countrySchema.optional(),
  /** City / region text (`where`). */
  where: z.string().trim().max(120).optional(),
  /**
   * Page cursor for infinite queries (1-based).
   * tRPC `useInfiniteQuery` injects this as `cursor`.
   */
  cursor: z.number().int().min(1).max(100).nullish(),
  pageSize: z.number().int().min(1).max(20).default(20),
  salaryMin: z.number().int().min(0).max(10_000_000).optional(),
  employmentTypes: z.array(jobEmploymentTypeSchema).max(4).optional(),
  remoteOnly: z.boolean().optional(),
  /** Max listing age in days (e.g. 1 / 7 / 30). */
  maxDaysOld: z.number().int().min(1).max(365).optional(),
  sortBy: jobSortBySchema.default("relevance"),
  /** Provider override; default = registry default (adzuna). */
  provider: jobProviderIdSchema.optional(),
})

export const normalizedJobSchema = z.object({
  id: z.string().min(1),
  provider: jobProviderIdSchema,
  externalId: z.string().min(1),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  description: z.string(),
  applyUrl: z.string().url().or(z.literal("")),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  salaryIsPredicted: z.boolean(),
  currencyHint: z.string().nullable(),
  employmentType: jobEmploymentTypeSchema,
  contractType: jobContractTypeSchema,
  remoteType: jobRemoteTypeSchema,
  postedAt: z.string(),
  category: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

export const jobSearchResultSchema = z.object({
  items: z.array(normalizedJobSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  provider: jobProviderIdSchema,
  cached: z.boolean(),
  country: countrySchema,
  where: z.string().nullable(),
})

export type JobProviderId = z.infer<typeof jobProviderIdSchema>
export type JobEmploymentType = z.infer<typeof jobEmploymentTypeSchema>
export type JobContractType = z.infer<typeof jobContractTypeSchema>
export type JobRemoteType = z.infer<typeof jobRemoteTypeSchema>
export type JobSortBy = z.infer<typeof jobSortBySchema>
export type JobSearchInput = z.infer<typeof jobSearchInputSchema>
export type NormalizedJob = z.infer<typeof normalizedJobSchema>
export type JobSearchResult = z.infer<typeof jobSearchResultSchema>
