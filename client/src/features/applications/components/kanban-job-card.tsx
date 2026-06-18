import { Clock, MoreHorizontal, ArrowUpRight, Wand2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TrackingProgressDots } from "./tracking-progress-dots"
import type { TrackedJob } from "../types"

interface KanbanJobCardProps {
  readonly job: TrackedJob
  readonly onViewDetails: (job: TrackedJob) => void
}

export function KanbanJobCard({ job, onViewDetails }: KanbanJobCardProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-primary">
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold select-none",
            job.avatarColorClass
          )}
        >
          {job.avatarText}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">{job.title}</span>
          <span className="truncate text-xs text-muted-foreground">{job.company} · {job.location}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem className="cursor-pointer" onClick={() => onViewDetails(job)}>
              <ArrowUpRight className="size-4" />
              {t("jobTracker.trackingActions.openDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Wand2 className="size-4" />
              {t("jobTracker.trackingActions.tailorResume")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer">
              <Trash2 className="size-4" />
              {t("jobTracker.trackingActions.remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between gap-2">
        <TrackingProgressDots
          totalSteps={job.progressSteps}
          completedSteps={job.progressCompleted}
          activeStepIndex={job.activeStepIndex}
        />
        <span className="text-xs font-semibold text-foreground">
          {job.matchScore}
          <span className="font-normal text-muted-foreground"> {t("jobTracker.matchSuffix")}</span>
        </span>
      </div>

      {job.nextStep && (
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground">
          <Clock className="size-3 shrink-0" />
          <span className="truncate">{job.nextStep}</span>
          {job.nextStepDate && job.nextStepDate !== "no date" && (
            <span className="ml-auto shrink-0 text-foreground/60">· {job.nextStepDate}</span>
          )}
        </div>
      )}
    </div>
  )
}
