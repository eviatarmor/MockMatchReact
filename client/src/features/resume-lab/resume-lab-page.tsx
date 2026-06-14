import { useTranslation } from "react-i18next"
import { Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { ResumeTable } from "./components/resume-table"
import { MOCK_RESUMES } from "./constants"

export function ResumeLabPageContent() {
  const { t } = useTranslation("common")

  const actions = (
    <>
      <Button
        variant="outline"
        className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
      >
        <Upload className="size-4" />
        <span className="hidden sm:inline">{t("dashboard.actions.importResume")}</span>
      </Button>
      <Button
        variant="default"
        className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">{t("dashboard.actions.newResume")}</span>
      </Button>
    </>
  )

  return (
    <DashboardPageShell
      title={t("resumeLab.title")}
      searchPlaceholder={t("dashboard.search.resumes")}
      actions={actions}
    >
      <div className="flex flex-col gap-6">
        <DashboardPageHeader
          title={t("resumeLab.title")}
          description={t("resumeLab.description")}
        />

        <ResumeTable resumes={MOCK_RESUMES} />
      </div>
    </DashboardPageShell>
  )
}
