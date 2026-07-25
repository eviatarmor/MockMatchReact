import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useInView } from "react-intersection-observer"
import { SearchX, AlertCircle, Settings2 } from "lucide-react"
import { useDetailPanel } from "@/hooks/use-detail-panel"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { DiscoverFilterBar } from "./discover-filter-bar"
import { DiscoverJobCard } from "./discover-job-card"
import { DiscoverJobCardSkeleton } from "./discover-job-card-skeleton"
import { JobDetailsPanel } from "./job-details-panel"
import type { DiscoverJobsState } from "../hooks/use-discover-jobs"
import type { DiscoverJob } from "../types"

interface DiscoverTabProps {
  readonly state: DiscoverJobsState
}

export function DiscoverTab({ state }: DiscoverTabProps) {
  const { t } = useTranslation("common")
  const { open, close } = useDetailPanel()

  const viewDetails = useCallback(
    (job: DiscoverJob) => {
      open(<JobDetailsPanel job={job} onClose={close} />)
    },
    [open, close]
  )

  useEffect(() => close, [close])

  const { ref: loadMoreRef, inView } = useInView({
    rootMargin: "240px",
    threshold: 0,
  })

  useEffect(() => {
    if (inView && state.hasNextPage && !state.isFetchingNextPage) {
      state.fetchNextPage()
    }
  }, [inView, state.hasNextPage, state.isFetchingNextPage, state.fetchNextPage])

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

      {state.isLoading && (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label={t("discover.loading")}>
          {Array.from({ length: 5 }).map((_, i) => (
            <DiscoverJobCardSkeleton key={i} />
          ))}
        </div>
      )}

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

      {!state.isLoading && !state.isError && state.jobs.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {state.jobs.map((job) => (
              <DiscoverJobCard key={job.id} job={job} onViewDetails={viewDetails} />
            ))}
          </div>

          <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />

          {state.isFetchingNextPage && (
            <div className="flex flex-col gap-2" aria-busy="true">
              <DiscoverJobCardSkeleton />
              <DiscoverJobCardSkeleton />
            </div>
          )}

          {!state.hasNextPage && state.jobs.length > 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              {t("discover.endOfList", { total: state.total })}
            </p>
          )}
        </>
      )}
    </div>
  )
}
