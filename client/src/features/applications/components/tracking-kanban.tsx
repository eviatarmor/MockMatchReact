import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from "@/components/ui/kanban"
import { KanbanJobCard } from "./kanban-job-card"
import { KanbanStatusBar } from "./kanban-status-bar"
import { useTrackingBoard } from "../hooks/use-tracking-board"
import { TRACKING_STATUS_ORDER } from "../constants"
import type { TrackedJob, TrackingStatus } from "../types"

interface TrackingKanbanProps {
  readonly jobs: TrackedJob[]
  readonly onStatusesChange?: (
    updates: ReadonlyArray<{ id: string; status: TrackingStatus }>
  ) => void
  readonly onRemove?: (id: string) => void
}

export function TrackingKanban({
  jobs,
  onStatusesChange,
  onRemove,
}: TrackingKanbanProps) {
  const { t } = useTranslation("common")
  const { columns, onColumnsChange } = useTrackingBoard(jobs, onStatusesChange)

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TRACKING_STATUS_ORDER.map((status) => [status, columns[status].length])
      ) as Record<TrackingStatus, number>,
    [columns]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/*
        Sticky secondary bar sits in the page ScrollArea (not a nested overflow
        scroller) so position:sticky pins under the main dashboard navbar when
        the page header / toolbar scroll away.
      */}
      <KanbanStatusBar counts={counts} />

      {/* Horizontal overflow only — keeps sticky working for vertical page scroll */}
      <div className="min-w-0 overflow-x-auto pb-3">
        <Kanban
          value={columns}
          onValueChange={onColumnsChange}
          getItemValue={(job) => job.id}
        >
          <KanbanBoard className="flex gap-3">
            {TRACKING_STATUS_ORDER.map((status) => {
              const items = columns[status]
              return (
                <KanbanColumn
                  key={status}
                  value={status}
                  className="min-w-60 flex-1 gap-2 border-none bg-muted/40 p-2"
                >
                  <div className="flex flex-1 flex-col gap-2">
                    {items.length === 0 ? (
                      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                        {t("applications.kanban.empty")}
                      </div>
                    ) : (
                      items.map((job) => (
                        <KanbanItem key={job.id} value={job.id} asHandle>
                          <KanbanJobCard job={job} onRemove={onRemove} />
                        </KanbanItem>
                      ))
                    )}
                  </div>
                </KanbanColumn>
              )
            })}
          </KanbanBoard>
          <KanbanOverlay>
            <div className="size-full rounded-xl bg-primary/10" />
          </KanbanOverlay>
        </Kanban>
      </div>
    </div>
  )
}
