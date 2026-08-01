import { type Ref } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@mockmatch/ui/button"
import type { PrepStep } from "../types"
import { PrepTaskRow } from "./prep-task-row"

export type PrepStepStatus = "completed" | "active" | "upcoming"

interface PrepStepCardProps {
  readonly step: PrepStep
  readonly stepNumber: number
  readonly status: PrepStepStatus
  readonly completedTasks: number
  readonly totalTasks: number
  readonly cardRef: Ref<HTMLDivElement>
}

const STATUS_BADGE_CLASS: Record<PrepStepStatus, string> = {
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  active: "bg-primary/10 text-primary",
  upcoming: "bg-muted text-muted-foreground",
}

const STATUS_LABEL_KEY: Record<PrepStepStatus, string> = {
  completed: "applicationDetail.stepStatus.done",
  active: "applicationDetail.stepStatus.inProgress",
  upcoming: "applicationDetail.stepStatus.upNext",
}

export function PrepStepCard({ step, stepNumber, status, completedTasks, totalTasks, cardRef }: PrepStepCardProps) {
  const { t } = useTranslation("common")
  const FooterIcon = step.footerActionIcon

  return (
    <div
      ref={cardRef}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm",
        status === "active" && "border-primary"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t("applicationDetail.stepBadge", { n: stepNumber })}
          </span>
          <span className="font-heading text-base font-semibold text-foreground">{t(step.titleKey)}</span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_BADGE_CLASS[status])}>
            {t(STATUS_LABEL_KEY[status])}
          </span>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {completedTasks}/{totalTasks}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{t(step.descriptionKey)}</p>

      <div className="flex flex-col">
        {step.tasks.map((task) => (
          <PrepTaskRow key={task.id} task={task} />
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" className="h-8 gap-1.5 cursor-pointer">
          <FooterIcon className="size-4" />
          {t(step.footerActionLabelKey)}
        </Button>
      </div>
    </div>
  )
}
