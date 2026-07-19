import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { TrackingTab } from "./components/tracking-tab"
import { TrackingKanban } from "./components/tracking-kanban"
import { ApplicationsViewToggle } from "./components/applications-view-toggle"
import type { ApplicationsView } from "./components/applications-view-toggle"
import { AddJobDialog } from "@/features/job-tracker/components/add-job-dialog"
import { MOCK_TRACKED_JOBS } from "./constants"

export function ApplicationsPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<ApplicationsView>("list")

  const filteredJobs = useMemo(
    () => MOCK_TRACKED_JOBS.filter(
      (job) =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  )

  return (
    <DashboardPageShell
      title={t("applications.title")}
    >
      <div className={view === "kanban" ? "flex flex-1 flex-col gap-3 min-h-0" : "flex flex-col gap-3"}>
        <DashboardPageHeader
          title={t("applications.title")}
          description={t("applications.description")}
        />
        <TableToolbar
          searchPlaceholder={t("dashboard.search.applications")}
          search={search}
          onSearchChange={setSearch}
          actions={
            <>
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
              <ApplicationsViewToggle view={view} onChange={setView} />
            </>
          }
        />
        {view === "list" ? (
          <TrackingTab jobs={filteredJobs} />
        ) : (
          <TrackingKanban jobs={filteredJobs} />
        )}
      </div>
    </DashboardPageShell>
  )
}
