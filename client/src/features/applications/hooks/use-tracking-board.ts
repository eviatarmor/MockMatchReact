import { useEffect, useMemo, useState } from "react"
import type { UniqueIdentifier } from "@dnd-kit/core"
import { TRACKING_STATUS_ORDER } from "../constants"
import type { TrackedJob, TrackingStatus } from "../types"

type Columns = Record<TrackingStatus, TrackedJob[]>

function groupByStatus(jobs: TrackedJob[]): Columns {
  const columns = Object.fromEntries(
    TRACKING_STATUS_ORDER.map((status) => [status, [] as TrackedJob[]])
  ) as Columns
  for (const job of jobs) {
    columns[job.status].push(job)
  }
  return columns
}

/**
 * Drag-and-drop board state for tracked jobs. Groups jobs into status columns
 * and keeps the local arrangement in sync as the incoming `jobs` change (e.g.
 * from the search filter). Dropping a card into another column flips its
 * `status` so the move sticks.
 */
export function useTrackingBoard(jobs: TrackedJob[]) {
  const [columns, setColumns] = useState<Columns>(() => groupByStatus(jobs))

  // Re-sync when the filtered input changes (search, added/removed jobs).
  const signature = useMemo(
    () => jobs.map((job) => `${job.id}:${job.status}`).join("|"),
    [jobs]
  )
  useEffect(() => {
    setColumns(groupByStatus(jobs))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  function handleChange(next: Record<UniqueIdentifier, TrackedJob[]>) {
    const normalized = Object.fromEntries(
      TRACKING_STATUS_ORDER.map((status) => [
        status,
        (next[status] ?? []).map((job) =>
          job.status === status ? job : { ...job, status }
        ),
      ])
    ) as Columns
    setColumns(normalized)
  }

  return { columns, onColumnsChange: handleChange }
}
