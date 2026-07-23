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

  const baseJobs: DiscoverJob[] = useMemo(() => {
    const pages = infiniteQuery.data?.pages ?? []
    return pages.flatMap((p) => p.items.map(mapNormalizedJobToDiscover))
  }, [infiniteQuery.data?.pages])

  const fit = useDiscoverFitScores(baseJobs)

  const jobs: DiscoverJob[] = useMemo(() => {
    let merged = baseJobs.map((job) => {
      const score = fit.scores[job.id]
      if (!score) return job
      return {
        ...job,
        matchScore: score.score,
        matchTier: score.tier,
        fitNote: score.fitNote || job.fitNote,
        skills: score.skills,
        scoreMode: score.mode,
        scorePending: false,
      }
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
  }, [baseJobs, fit.scores, fit.isScoring, sort])

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
