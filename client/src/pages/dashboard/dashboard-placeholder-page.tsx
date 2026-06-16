import { useTranslation } from "react-i18next"
import { Upload, Plus, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"

interface DashboardPageConfig {
  readonly actions?: (t: (key: string) => React.ReactNode) => React.ReactNode
}

const PAGE_CONFIGS: Record<string, DashboardPageConfig> = {
  "resume-lab": {
    actions: (t) => (
      <>
        <Button variant="outline" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
          <Upload className="size-4" />
          <span className="hidden sm:inline">{t("dashboard.actions.importResume")}</span>
        </Button>
        <Button variant="outline" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
          <Sparkles className="size-4" />
          <span className="hidden lg:inline xl:hidden">{t("dashboard.actions.generateForJobShort")}</span>
          <span className="hidden xl:inline">{t("dashboard.actions.generateResumeForJob")}</span>
        </Button>
        <Button variant="default" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("dashboard.actions.newResume")}</span>
        </Button>
      </>
    ),
  },
  "cover-letters": {
    actions: (t) => (
      <>
        <Button variant="outline" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
          <Upload className="size-4" />
          <span className="hidden sm:inline">{t("dashboard.actions.importCoverLetter")}</span>
        </Button>
        <Button variant="default" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("dashboard.actions.newCoverLetter")}</span>
        </Button>
      </>
    ),
  },
  "job-workflow": {
    actions: (t) => (
      <Button variant="default" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
        <Plus className="size-4" />
        <span className="hidden sm:inline">{t("dashboard.actions.newWorkflow")}</span>
      </Button>
    ),
  },
  "simulations": {
    actions: (t) => (
      <Button variant="default" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
        <Play className="size-4" />
        <span className="hidden sm:inline">{t("dashboard.actions.startSimulation")}</span>
      </Button>
    ),
  },
  "assessments": {
    actions: (t) => (
      <Button variant="default" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
        <Play className="size-4" />
        <span className="hidden sm:inline">{t("dashboard.actions.startAssessment")}</span>
      </Button>
    ),
  },
  "question-bank": {},
  "readiness": {},
  "performance": {},
  "autofill": {
    actions: (t) => (
      <Button variant="default" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5">
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">{t("dashboard.actions.addProfile")}</span>
      </Button>
    ),
  },
}

export function DashboardRoutePage({
  path,
  titleKey,
}: {
  readonly path: string
  readonly titleKey: string
}) {
  const { t } = useTranslation("common")
  const config = PAGE_CONFIGS[path]

  return (
    <DashboardPageShell
      title={t(titleKey)}
      actions={config?.actions?.(t)}
    />
  )
}
