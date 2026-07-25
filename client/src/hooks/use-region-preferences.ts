import {
  DEFAULT_USER_PREFERENCES,
  type Country,
  type DateFormat,
  type TimeFormat,
} from "@mockmatch/schemas"
import type { Dialect } from "harper.js"
import { countryToDialect } from "@/lib/grammar/harper"
import { trpc } from "@/lib/trpc"

export interface RegionPreferences {
  readonly country: Country
  readonly dateFormat: DateFormat
  readonly timeFormat: TimeFormat
  /** Harper English dialect derived from country. */
  readonly dialect: Dialect
  readonly isLoading: boolean
}

const STALE_TIME_MS = 60_000

/**
 * Region prefs from account settings (country, date/time formats, Harper dialect).
 * Defaults while loading / when unauthenticated. Shares `account.get` React Query cache.
 */
export function useRegionPreferences(): RegionPreferences {
  const accountQuery = trpc.account.get.useQuery(undefined, {
    staleTime: STALE_TIME_MS,
    retry: false,
  })

  const prefs = accountQuery.data?.preferences
  const country = prefs?.country ?? DEFAULT_USER_PREFERENCES.country
  const dateFormat = prefs?.dateFormat ?? DEFAULT_USER_PREFERENCES.dateFormat
  const timeFormat = prefs?.timeFormat ?? DEFAULT_USER_PREFERENCES.timeFormat

  return {
    country,
    dateFormat,
    timeFormat,
    dialect: countryToDialect(country),
    isLoading: accountQuery.isLoading,
  }
}
