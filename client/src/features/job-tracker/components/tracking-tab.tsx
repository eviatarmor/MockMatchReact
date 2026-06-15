import { useCallback, useEffect, useMemo, useState } from "react"
import { useDetailPanel } from "@/hooks/use-detail-panel"
import { TrackingSummaryCards } from "./tracking-summary-cards"
import { TrackedJobRow } from "./tracked-job-row"
import { TrackedJobDetailsPanel } from "./tracked-job-details-panel"
import { MOCK_TRACKED_JOBS } from "../constants"
import type { TrackedJob, TrackingStatus } from "../types"

export function TrackingTab() {
  const [statusFilter, setStatusFilter] = useState<TrackingStatus | null>(null)
  const { open, close } = useDetailPanel()

  const viewDetails = useCallback(
    (job: TrackedJob) => {
      open(<TrackedJobDetailsPanel job={job} onClose={close} />)
    },
    [open, close]
  )

  useEffect(() => close, [close])

  const jobs = useMemo(() => {
    if (!statusFilter) return MOCK_TRACKED_JOBS
    return MOCK_TRACKED_JOBS.filter((job) => job.status === statusFilter)
  }, [statusFilter])

  return (
    <div className="flex flex-col gap-2">
      <TrackingSummaryCards
        jobs={MOCK_TRACKED_JOBS}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <div className="flex flex-col gap-2">
        {jobs.map((job) => (
          <TrackedJobRow key={job.id} job={job} onViewDetails={viewDetails} />
        ))}
      </div>
    </div>
  )
}
