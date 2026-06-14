import { Clock, ExternalLink, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TrackingStatusBadge } from "./tracking-status-badge"
import { TrackingProgressDots } from "./tracking-progress-dots"
import type { TrackedJob } from "../types"

interface TrackedJobRowProps {
  readonly job: TrackedJob
}

export function TrackedJobRow({ job }: TrackedJobRowProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none",
            job.avatarColorClass
          )}
        >
          {job.avatarText}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">{job.title}</span>
          <span className="text-xs text-muted-foreground">
            {job.company} · {job.location}
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{job.nextStep}</span>
            {job.nextStepDate && <span>· {job.nextStepDate}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <TrackingStatusBadge status={job.status} />
          <TrackingProgressDots
            totalSteps={job.progressSteps}
            completedSteps={job.progressCompleted}
            activeStepIndex={job.activeStepIndex}
          />
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-sm font-semibold text-foreground">
            {job.matchScore} <span className="text-xs font-normal text-muted-foreground">{t("jobTracker.matchSuffix")}</span>
          </span>
          <span className="text-xs text-muted-foreground">{job.statusUpdatedAt}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer">
            <ExternalLink className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
