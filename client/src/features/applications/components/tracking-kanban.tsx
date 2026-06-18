import { useCallback, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import type { KanbanColumn } from "@/components/kanban/kanban-board"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useDetailPanel } from "@/hooks/use-detail-panel"
import { KanbanJobCard } from "./kanban-job-card"
import { TrackedJobDetailsPanel } from "./tracked-job-details-panel"
import { TRACKING_STATUS_ORDER } from "../constants"
import type { TrackedJob, TrackingStatus } from "../types"

const COLUMN_DOT_CLASS: Record<TrackingStatus, string> = {
  saved: "bg-neutral-400",
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
}

interface TrackingKanbanProps {
  readonly jobs: TrackedJob[]
}

export function TrackingKanban({ jobs }: TrackingKanbanProps) {
  const { t } = useTranslation("common")
  const { open, close } = useDetailPanel()

  const viewDetails = useCallback(
    (job: TrackedJob) => {
      open(<TrackedJobDetailsPanel job={job} onClose={close} />)
    },
    [open, close]
  )

  useEffect(() => close, [close])

  const columns = useMemo<KanbanColumn<TrackedJob>[]>(
    () =>
      TRACKING_STATUS_ORDER.map((status) => ({
        id: status,
        label: t(`jobTracker.statusLabels.${status}`),
        items: jobs.filter((job) => job.status === status),
        dotClass: COLUMN_DOT_CLASS[status],
      })),
    [jobs, t]
  )

  return (
    <ScrollArea className="flex-1 min-h-0">
      <KanbanBoard
        columns={columns}
        keyExtractor={(job) => job.id}
        renderCard={(job) => (
          <KanbanJobCard job={job} onViewDetails={viewDetails} />
        )}
        className="h-full"
      />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
