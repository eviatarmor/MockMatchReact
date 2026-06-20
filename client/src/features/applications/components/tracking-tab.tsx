import { useMemo, useState } from "react"
import { TrackingSummaryCards } from "./tracking-summary-cards"
import { TrackedJobRow } from "./tracked-job-row"
import type { TrackedJob, TrackingStatus } from "../types"

interface TrackingTabProps {
  readonly jobs: TrackedJob[]
}

export function TrackingTab({ jobs }: TrackingTabProps) {
  const [statusFilter, setStatusFilter] = useState<TrackingStatus | null>(null)

  const filteredJobs = useMemo(() => {
    if (!statusFilter) return jobs
    return jobs.filter((job) => job.status === statusFilter)
  }, [jobs, statusFilter])

  return (
    <div className="flex flex-col gap-2">
      <TrackingSummaryCards
        jobs={jobs}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <div className="flex flex-col gap-2">
        {filteredJobs.map((job) => (
          <TrackedJobRow key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
