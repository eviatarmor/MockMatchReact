import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { SearchBar } from "@/components/dashboard/search-bar"
import { TrackingTab } from "./components/tracking-tab"
import { AddJobDialog } from "@/features/job-tracker/components/add-job-dialog"
import { MOCK_TRACKED_JOBS } from "./constants"

export function ApplicationsPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")

  const filteredJobs = useMemo(
    () => MOCK_TRACKED_JOBS.filter(
      (job) =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  )

  const actions = (
    <AddJobDialog
      trigger={
        <Button
          variant="default"
          className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
        >
          <Upload className="size-4" />
          <span className="hidden sm:inline">{t("dashboard.actions.importJob")}</span>
        </Button>
      }
    />
  )

  return (
    <DashboardPageShell
      title={t("applications.title")}
      actions={actions}
    >
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("applications.title")}
          description={t("applications.description")}
        />
        <SearchBar
          placeholder={t("dashboard.search.applications")}
          value={search}
          onChange={setSearch}
        />
        <TrackingTab jobs={filteredJobs} />
      </div>
    </DashboardPageShell>
  )
}
