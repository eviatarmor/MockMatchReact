import {
  DEFAULT_USER_PREFERENCES,
  type Country,
  type DateFormat,
  type Language,
  type TimeFormat,
} from "@mockmatch/schemas"
import type { Dialect } from "harper.js"
import { languageToDialect } from "@/lib/grammar/harper"
import { trpc } from "@/lib/trpc"

export interface RegionPreferences {
  readonly language: Language
  readonly country: Country
  readonly dateFormat: DateFormat
  readonly timeFormat: TimeFormat
  /** Harper English dialect derived from language (not country). */
  readonly dialect: Dialect
  readonly isLoading: boolean
}

const STALE_TIME_MS = 60_000

/**
 * Region prefs from account settings (language, country, date/time, Harper dialect).
 * Defaults while loading / when unauthenticated. Shares `account.get` React Query cache.
 */
export function useRegionPreferences(): RegionPreferences {
  const accountQuery = trpc.account.get.useQuery(undefined, {
    staleTime: STALE_TIME_MS,
    retry: false,
  })

  const prefs = accountQuery.data?.preferences
  const language = prefs?.language ?? DEFAULT_USER_PREFERENCES.language
  const country = prefs?.country ?? DEFAULT_USER_PREFERENCES.country
  const dateFormat = prefs?.dateFormat ?? DEFAULT_USER_PREFERENCES.dateFormat
  const timeFormat = prefs?.timeFormat ?? DEFAULT_USER_PREFERENCES.timeFormat

  return {
    language,
    country,
    dateFormat,
    timeFormat,
    dialect: languageToDialect(language),
    isLoading: accountQuery.isLoading,
  }
}
