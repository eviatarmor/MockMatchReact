import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Upload, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { ResumeFilterTabs } from "./components/resume-filter-tabs"
import { ResumeSortSelect } from "./components/resume-sort-select"
import { ResumeTable } from "./components/resume-table"
import { MOCK_RESUMES } from "./constants"

export function ResumeLabPageContent() {
  const { t } = useTranslation("common")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"lastEdited" | "title" | "atsScore">("lastEdited")

  const processedResumes = useMemo(() => {
    // 1. Filter
    let items = [...MOCK_RESUMES]
    if (activeTab !== "all") {
      items = items.filter((item) => item.status === activeTab)
    }

    // 2. Sort
    if (sortBy === "title") {
      items.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === "atsScore") {
      items.sort((a, b) => {
        const scoreA = a.atsScore ?? -1
        const scoreB = b.atsScore ?? -1
        return scoreB - scoreA
      })
    }
    // "lastEdited" matches the natural order of mock data, so no sorting needed.

    return items
  }, [activeTab, sortBy])

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
        variant="outline"
        className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
      >
        <Sparkles className="size-4" />
        <span className="hidden lg:inline xl:hidden">
          {t("dashboard.actions.generateForJobShort")}
        </span>
        <span className="hidden xl:inline">
          {t("dashboard.actions.generateResumeForJob")}
        </span>
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ResumeFilterTabs activeTab={activeTab} onChange={setActiveTab} />
          <ResumeSortSelect sortBy={sortBy} onChange={setSortBy} />
        </div>

        <ResumeTable resumes={processedResumes} />
      </div>
    </DashboardPageShell>
  )
}
