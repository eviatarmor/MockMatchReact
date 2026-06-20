import { useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { Button } from "@/components/ui/button"
import { MOCK_TRACKED_JOBS } from "@/features/job-tracker/constants"
import { PREP_STEPS } from "./constants"
import { useStepScrollspy } from "./hooks/use-step-scrollspy"
import { ApplicationDetailHeader } from "./components/application-detail-header"
import { ApplicationSummaryCard } from "./components/application-summary-card"
import { PrepStepNav } from "./components/prep-step-nav"
import { PrepStepRail } from "./components/prep-step-rail"
import { PrepStepCard, type PrepStepStatus } from "./components/prep-step-card"
import type { PrepTask } from "./types"

const STEP_IDS = PREP_STEPS.map((step) => step.id)

export function ApplicationDetailPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const { jobId } = useParams<{ jobId: string }>()
  const job = useMemo(() => MOCK_TRACKED_JOBS.find((tracked) => tracked.id === jobId), [jobId])

  const { activeStepId, registerStepRef, scrollToStep } = useStepScrollspy(STEP_IDS)

  const { totalTasks, completedTasks, percent, currentStepIndex, nextTask } = useMemo(() => {
    let total = 0
    let completed = 0
    let firstIncompleteStepIndex = -1
    let firstIncompleteTask: PrepTask | null = null

    PREP_STEPS.forEach((step, index) => {
      step.tasks.forEach((task) => {
        total += 1
        if (task.completed) {
          completed += 1
        } else if (firstIncompleteStepIndex === -1) {
          firstIncompleteStepIndex = index
          firstIncompleteTask = task
        }
      })
    })

    const stepIndex = firstIncompleteStepIndex === -1 ? PREP_STEPS.length - 1 : firstIncompleteStepIndex

    return {
      totalTasks: total,
      completedTasks: completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      currentStepIndex: stepIndex,
      nextTask: firstIncompleteTask,
    }
  }, [])

  if (!job) {
    return (
      <DashboardPageShell title={t("applicationDetail.title")}>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("applicationDetail.notFound")}</p>
          <Button variant="outline" className="cursor-pointer" onClick={() => navigate("/applications")}>
            {t("applicationDetail.backLink")}
          </Button>
        </div>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell title={t("applicationDetail.title")}>
      <div className="flex flex-col gap-4">
        <ApplicationDetailHeader currentJob={job} />

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("applicationDetail.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("applicationDetail.description")}</p>
        </div>

        <ApplicationSummaryCard
          job={job}
          currentStep={PREP_STEPS[currentStepIndex]}
          currentStepNumber={currentStepIndex + 1}
          nextTask={nextTask}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          percent={percent}
        />

        <PrepStepNav steps={PREP_STEPS} activeStepId={activeStepId} onSelectStep={scrollToStep} />

        <div className="flex gap-4">
          <PrepStepRail steps={PREP_STEPS} activeStepId={activeStepId} onSelectStep={scrollToStep} />

          <div className="flex flex-1 flex-col gap-3 min-w-0">
            {PREP_STEPS.map((step, index) => {
              let status: PrepStepStatus = "upcoming"
              if (index < currentStepIndex) status = "completed"
              else if (index === currentStepIndex) status = "active"
              const completed = step.tasks.filter((task) => task.completed).length

              return (
                <PrepStepCard
                  key={step.id}
                  step={step}
                  stepNumber={index + 1}
                  status={status}
                  completedTasks={completed}
                  totalTasks={step.tasks.length}
                  cardRef={registerStepRef(step.id)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </DashboardPageShell>
  )
}
