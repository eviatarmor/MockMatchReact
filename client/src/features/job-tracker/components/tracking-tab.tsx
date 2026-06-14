import { TrackingSummaryCards } from "./tracking-summary-cards"
import { TrackedJobRow } from "./tracked-job-row"
import { MOCK_TRACKED_JOBS } from "../constants"

export function TrackingTab() {
  return (
    <div className="flex flex-col gap-3">
      <TrackingSummaryCards jobs={MOCK_TRACKED_JOBS} />

      <div className="flex flex-col gap-3">
        {MOCK_TRACKED_JOBS.map((job) => (
          <TrackedJobRow key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
