import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"
import { SearchX, AlertCircle, Settings2, Briefcase } from "lucide-react"
import { useDetailPanel } from "@/hooks/use-detail-panel"
import { useMediaQuery } from "@/hooks/use-media-query"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { Card } from "@/components/ui/card"
import { StaggerItem } from "@/components/ui/stagger"
import { cn } from "@/lib/utils"
import { DiscoverFilterBar } from "./discover-filter-bar"
import { DiscoverJobListItem } from "./discover-job-list-item"
import { DiscoverJobListItemSkeleton } from "./discover-job-list-item-skeleton"
import { JobDetailsPanel } from "./job-details-panel"
import type { DiscoverJobsState } from "../hooks/use-discover-jobs"
import type { DiscoverJob } from "../types"

interface DiscoverTabProps {
  readonly state: DiscoverJobsState
}

export function DiscoverTab({ state }: DiscoverTabProps) {
  const { t } = useTranslation("common")
  const { open, close } = useDetailPanel()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const selectedJob = useMemo(
    () => state.jobs.find((job) => job.id === selectedJobId) ?? null,
    [state.jobs, selectedJobId]
  )

  // Keep selection in sync with the live list (filters / pagination / scores).
  useEffect(() => {
    if (state.jobs.length === 0) {
      setSelectedJobId(null)
      return
    }
    setSelectedJobId((prev) => {
      if (prev && state.jobs.some((job) => job.id === prev)) return prev
      return state.jobs[0]!.id
    })
  }, [state.jobs])

  // Sheet only on mobile; close when switching to desktop split.
  useEffect(() => {
    if (isDesktop) close()
  }, [isDesktop, close])

  useEffect(() => close, [close])

  const selectJob = useCallback(
    (job: DiscoverJob) => {
      setSelectedJobId(job.id)
      if (!isDesktop) {
        open(<JobDetailsPanel job={job} onClose={close} variant="sheet" />)
      }
    },
    [isDesktop, open, close]
  )

  // Page-level scroll: observer uses default root (dashboard ScrollArea).
  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "240px",
    threshold: 0,
  })

  useEffect(() => {
    if (inView && state.hasNextPage && !state.isFetchingNextPage) {
      state.fetchNextPage()
    }
  }, [inView, state.hasNextPage, state.isFetchingNextPage, state.fetchNextPage])

  const showListChrome =
    state.isLoading ||
    (!state.isError && state.jobs.length > 0) ||
    state.isFetchingNextPage

  return (
    <div className="flex flex-col gap-3">
      <DiscoverFilterBar
        search={state.search}
        onSearchChange={state.setSearch}
        location={state.location}
        onLocationChange={state.setLocation}
        locationStatus={state.locationStatus}
        onDetectLocation={state.detectLocation}
        allowLocation={state.allowLocation}
        country={state.country}
        remoteOnly={state.remoteOnly}
        onToggleRemote={state.toggleRemote}
        minSalary={state.minSalary}
        onMinSalaryChange={state.setMinSalary}
        employmentTypes={state.employmentTypes}
        onToggleEmploymentType={state.toggleEmploymentType}
        postedWithin={state.postedWithin}
        onPostedWithinChange={state.setPostedWithin}
        sort={state.sort}
        onSortChange={state.setSort}
      />

      {!state.isLoading && state.isNotConfigured && (
        <EntityEmptyState
          icon={Settings2}
          title={t("discover.empty.notConfiguredTitle")}
          description={t("discover.empty.notConfiguredDescription")}
        />
      )}

      {!state.isLoading && state.isError && !state.isNotConfigured && (
        <EntityEmptyState
          icon={AlertCircle}
          title={t("discover.empty.errorTitle")}
          description={state.errorMessage ?? t("discover.empty.errorDescription")}
          action={{
            label: t("discover.empty.retry"),
            variant: "outline",
            onClick: () => void state.refetch(),
          }}
        />
      )}

      {!state.isLoading && !state.isError && state.isEmpty && (
        <EntityEmptyState
          icon={SearchX}
          title={t("discover.empty.noResultsTitle")}
          description={t("discover.empty.noResultsDescription")}
          action={
            state.hasActiveFilters
              ? {
                  label: t("discover.empty.clearFilters"),
                  variant: "outline",
                  onClick: state.clearFilters,
                }
              : undefined
          }
        />
      )}

      {showListChrome && (
        <div
          className={cn(
            "grid items-start gap-3",
            "grid-cols-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"
          )}
        >
          {/* Left: list grows with page scroll */}
          <div
            role="listbox"
            aria-label={t("discover.jobListLabel")}
            aria-busy={state.isLoading || state.isFetchingNextPage}
            className="flex min-w-0 flex-col gap-2"
          >
            {state.isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <DiscoverJobListItemSkeleton key={i} />
              ))}

            {!state.isLoading &&
              state.jobs.map((job, index) => (
                <StaggerItem key={job.id} index={index}>
                  <DiscoverJobListItem
                    job={job}
                    selected={job.id === selectedJobId}
                    onSelect={selectJob}
                  />
                </StaggerItem>
              ))}

            <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />

            {state.isFetchingNextPage && (
              <>
                <DiscoverJobListItemSkeleton />
                <DiscoverJobListItemSkeleton />
              </>
            )}

            {!state.isLoading && state.jobs.length > 0 && (
              <p className="py-3 text-center text-xs text-muted-foreground">
                {state.hasNextPage
                  ? t("discover.resultsCount", { count: state.total })
                  : t("discover.endOfList", { total: state.total })}
              </p>
            )}
          </div>

          {/* Right: sticky detail card — stays while page scrolls */}
          <Card
            className={cn(
              "sticky top-2 hidden min-h-0 flex-col overflow-hidden py-0 ring-foreground/10 lg:flex",
              "h-[calc(100svh-5.5rem)] self-start",
              "hover:ring-foreground/10"
            )}
          >
            {selectedJob ? (
              <div className="min-h-0 flex-1">
                <JobDetailsPanel job={selectedJob} variant="pane" />
              </div>
            ) : state.isLoading ? (
              <div className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-start gap-3">
                  <div className="size-10 animate-pulse rounded-xl bg-muted" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
                <div className="h-40 animate-pulse rounded-xl bg-muted" />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <Briefcase className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t("discover.selectJob")}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
