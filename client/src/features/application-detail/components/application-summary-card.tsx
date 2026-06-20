import { useTranslation } from "react-i18next"
import { ArrowRight, Columns3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { TrackedJob } from "@/features/job-tracker/types"
import type { PrepStep, PrepTask } from "../types"
import { PipelineStatus } from "./pipeline-status"
import { TimelineProgressRing } from "./timeline-progress-ring"

interface ApplicationSummaryCardProps {
  readonly job: TrackedJob
  readonly currentStep: PrepStep
  readonly currentStepNumber: number
  readonly nextTask: PrepTask | null
  readonly completedTasks: number
  readonly totalTasks: number
  readonly percent: number
}

export function ApplicationSummaryCard({
  job,
  currentStep,
  currentStepNumber,
  nextTask,
  completedTasks,
  totalTasks,
  percent,
}: ApplicationSummaryCardProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-semibold select-none",
              job.avatarColorClass
            )}
          >
            {job.avatarText}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-heading text-lg font-semibold text-foreground">{job.title}</span>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span>{job.company}</span>
              <span>·</span>
              <span>{job.location}</span>
              <span>·</span>
              <span>{job.salaryRange}</span>
              <span className="font-semibold text-emerald-600">
                {job.matchScore} {t("jobTracker.matchSuffix")}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">· {job.statusUpdatedAt}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-xs text-muted-foreground">
              {t("applicationDetail.tasksCount", { completed: completedTasks, total: totalTasks })}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {t("applicationDetail.stepLabel", { n: currentStepNumber, title: t(currentStep.titleKey) })}
            </span>
          </div>
          <TimelineProgressRing percent={percent} />
        </div>
      </div>

      {nextTask && (
        <>
          <div className="border-t" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowRight className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {t("applicationDetail.nextUp")}
                </span>
                <span className="text-sm font-medium text-foreground">{t(nextTask.labelKey)}</span>
              </div>
            </div>
            <Button className="gap-1.5 cursor-pointer">
              <Columns3 className="size-4" />
              {nextTask.actionLabelKey ? t(nextTask.actionLabelKey) : t(currentStep.footerActionLabelKey)}
            </Button>
          </div>
        </>
      )}

      <div className="border-t" />
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("applicationDetail.pipeline")}
        </span>
        <PipelineStatus status={job.status} />
      </div>
    </div>
  )
}
