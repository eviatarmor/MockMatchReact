import { useCallback, useEffect, useMemo, useState } from "react"
import type { Country } from "@mockmatch/schemas"
import { trpc } from "@/lib/trpc"
import { mapNormalizedJobToDiscover } from "../lib/map-job"
import type {
  DiscoverJob,
  DiscoverSortOption,
  EmploymentType,
  PostedWithinDays,
} from "../types"
import { useDetectLocation } from "./use-detect-location"
import { useDiscoverFitScores } from "./use-discover-fit-scores"
import { useDiscoverSummaries } from "./use-discover-summaries"

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400
const STALE_TIME_MS = 5 * 60 * 1000

function sortToApi(sort: DiscoverSortOption): "relevance" | "date" | "salary" {
  if (sort === "newest") return "date"
  if (sort === "salary") return "salary"
  return "relevance"
}

export function useDiscoverJobs() {
  const accountQuery = trpc.account.get.useQuery(undefined, {
    staleTime: 60_000,
  })

  const country: Country = accountQuery.data?.preferences.country ?? "US"
  const allowLocation =
    accountQuery.data?.preferences.privacy.allowLocationMetadata === true

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [locationInput, setLocationInput] = useState("")
  const [debouncedLocation, setDebouncedLocation] = useState("")
  const [locationTouched, setLocationTouched] = useState(false)
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [minSalary, setMinSalary] = useState(0)
  const [employmentTypes, setEmploymentTypes] = useState<ReadonlySet<EmploymentType>>(
    () => new Set()
  )
  const [postedWithin, setPostedWithin] = useState<PostedWithinDays>(0)
  const [sort, setSort] = useState<DiscoverSortOption>("bestMatch")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedLocation(locationInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [locationInput])

  const onDetected = useCallback((city: string) => {
    setLocationInput((prev) => {
      if (locationTouched && prev.trim()) return prev
      return city
    })
  }, [locationTouched])

  const geo = useDetectLocation({
    enabled: allowLocation && accountQuery.isSuccess,
    onDetected,
  })

  const effectiveWhere = debouncedLocation || undefined

  const employmentList = useMemo(
    () =>
      [...employmentTypes].filter(
        (t): t is Exclude<EmploymentType, "unknown"> => t !== "unknown"
      ),
    [employmentTypes]
  )

  const queryEnabled = accountQuery.isSuccess

  const infiniteQuery = trpc.jobs.search.useInfiniteQuery(
    {
      query: debouncedSearch || undefined,
      country,
      where: effectiveWhere,
      pageSize: PAGE_SIZE,
      salaryMin: minSalary > 0 ? minSalary : undefined,
      employmentTypes: employmentList.length > 0 ? employmentList : undefined,
      remoteOnly: remoteOnly || undefined,
      maxDaysOld: postedWithin > 0 ? postedWithin : undefined,
      sortBy: sortToApi(sort),
    },
    {
      enabled: queryEnabled,
      staleTime: STALE_TIME_MS,
      getNextPageParam: (lastPage) => {
        const loaded = lastPage.page * lastPage.pageSize
        return loaded < lastPage.total ? lastPage.page + 1 : undefined
      },
    }
  )

  // Adzuna (and similar) often re-surface the same listing across pages —
  // especially with remote soft-filters. Dedup by provider id so React keys stay unique.
  const baseJobs: DiscoverJob[] = useMemo(() => {
    const pages = infiniteQuery.data?.pages ?? []
    const seen = new Set<string>()
    const out: DiscoverJob[] = []
    for (const page of pages) {
      for (const item of page.items) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        out.push(mapNormalizedJobToDiscover(item))
      }
    }
    return out
  }, [infiniteQuery.data?.pages])

  const fit = useDiscoverFitScores(baseJobs)
  const blurb = useDiscoverSummaries(baseJobs)

  const jobs: DiscoverJob[] = useMemo(() => {
    let merged = baseJobs.map((job) => {
      const score = fit.scores[job.id]
      // Prefer AI summary; keep map-job heuristic so cards never blank/skeleton forever
      const summary = blurb.summaries[job.id] ?? job.summary
      let next: DiscoverJob = {
        ...job,
        summary,
        // Subtle upgrade-in-progress only if we still only have heuristic and AI is running
        summaryPending:
          blurb.isSummarizing &&
          !blurb.summaries[job.id] &&
          job.description.trim().length > 0,
      }
      if (score) {
        next = {
          ...next,
          matchScore: score.score,
          matchTier: score.tier,
          fitNote: score.fitNote || job.fitNote,
          skills: score.skills,
          scoreMode: score.mode,
          scorePending: false,
        }
      }
      return next
    })

    if (sort === "bestMatch") {
      const anyScored = merged.some((j) => j.matchScore != null)
      if (anyScored) {
        merged = [...merged].sort(
          (a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1)
        )
      }
    }

    // mark unscored as pending when fit is loading and we have resumes/activity
    if (fit.isScoring) {
      merged = merged.map((job) =>
        job.matchScore == null
          ? { ...job, scorePending: true }
          : job
      )
    }

    return merged
  }, [baseJobs, fit.scores, fit.isScoring, blurb.summaries, blurb.isSummarizing, sort])

  const total = infiniteQuery.data?.pages[0]?.total ?? 0

  const setLocation = useCallback((value: string) => {
    setLocationTouched(true)
    setLocationInput(value)
  }, [])

  const toggleRemote = useCallback(() => {
    setRemoteOnly((prev) => !prev)
  }, [])

  const setMinSalaryFilter = useCallback((value: number) => {
    setMinSalary(value)
  }, [])

  const toggleEmploymentType = useCallback((type: EmploymentType) => {
    setEmploymentTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }, [])

  const setPostedWithinFilter = useCallback((value: PostedWithinDays) => {
    setPostedWithin(value)
  }, [])

  const setSortFilter = useCallback((value: DiscoverSortOption) => {
    setSort(value)
  }, [])

  const clearFilters = useCallback(() => {
    setSearch("")
    setDebouncedSearch("")
    setLocationInput(geo.city ?? "")
    setLocationTouched(false)
    setRemoteOnly(false)
    setMinSalary(0)
    setEmploymentTypes(new Set())
    setPostedWithin(0)
    setSort("bestMatch")
  }, [geo.city])

  const isNotConfigured =
    infiniteQuery.error?.data?.code === "PRECONDITION_FAILED"

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    Boolean(locationInput.trim()) ||
    remoteOnly ||
    minSalary > 0 ||
    employmentTypes.size > 0 ||
    postedWithin > 0

  const isLoading = !queryEnabled || (infiniteQuery.isLoading && !infiniteQuery.data)
  const isEmpty =
    queryEnabled &&
    !infiniteQuery.isLoading &&
    jobs.length === 0 &&
    !infiniteQuery.isError

  const fetchNextPage = useCallback(() => {
    if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      void infiniteQuery.fetchNextPage()
    }
  }, [
    infiniteQuery.hasNextPage,
    infiniteQuery.isFetchingNextPage,
    infiniteQuery.fetchNextPage,
  ])

  return {
    country,
    search,
    setSearch,
    location: locationInput,
    setLocation,
    locationStatus: geo.status,
    detectLocation: geo.detect,
    allowLocation,
    remoteOnly,
    toggleRemote,
    minSalary,
    setMinSalary: setMinSalaryFilter,
    employmentTypes,
    toggleEmploymentType,
    postedWithin,
    setPostedWithin: setPostedWithinFilter,
    sort,
    setSort: setSortFilter,
    total,
    jobs,
    isLoading,
    isFetching: infiniteQuery.isFetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: Boolean(infiniteQuery.hasNextPage),
    fetchNextPage,
    isError: infiniteQuery.isError,
    isNotConfigured,
    isEmpty,
    hasActiveFilters,
    clearFilters,
    refetch: infiniteQuery.refetch,
    errorMessage: infiniteQuery.error?.message,
    fitMode: fit.mode,
    creditsRemaining: fit.creditsRemaining,
  }
}

export type DiscoverJobsState = ReturnType<typeof useDiscoverJobs>
