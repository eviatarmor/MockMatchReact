import { useTranslation } from "react-i18next"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from "@/components/ui/kanban"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { KanbanJobCard } from "./kanban-job-card"
import { useTrackingBoard } from "../hooks/use-tracking-board"
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
  const { columns, onColumnsChange } = useTrackingBoard(jobs)

  return (
    <ScrollArea className="flex-1 min-h-0">
      <Kanban
        value={columns}
        onValueChange={onColumnsChange}
        getItemValue={(job) => job.id}
      >
        <KanbanBoard className="flex gap-3 pb-3">
          {TRACKING_STATUS_ORDER.map((status) => {
            const items = columns[status]
            return (
              <KanbanColumn
                key={status}
                value={status}
                className="min-w-60 flex-1 gap-2 border-none bg-muted/40 p-2"
              >
                <div className="flex items-center gap-2 px-1">
                  <span className={cn("size-2 rounded-full", COLUMN_DOT_CLASS[status])} />
                  <span className="text-sm font-medium text-foreground">
                    {t(`jobTracker.statusLabels.${status}`)}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {items.length === 0 ? (
                    <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                      {t("applications.kanban.empty")}
                    </div>
                  ) : (
                    items.map((job) => (
                      <KanbanItem key={job.id} value={job.id} asHandle>
                        <KanbanJobCard job={job} />
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
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
