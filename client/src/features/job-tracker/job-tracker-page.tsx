import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { SearchBar } from "@/components/dashboard/search-bar"
import { DiscoverTab } from "./components/discover-tab"
import { AddJobDialog } from "./components/add-job-dialog"
import { MOCK_DISCOVER_JOBS } from "./constants"

export function JobTrackerPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")

  const filteredJobs = useMemo(
    () => MOCK_DISCOVER_JOBS.filter(
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
      title={t("discover.title")}
      actions={actions}
    >
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("discover.title")}
          description={t("discover.description")}
        />
        <SearchBar
          placeholder={t("dashboard.search.discover")}
          value={search}
          onChange={setSearch}
        />
        <DiscoverTab jobs={filteredJobs} />
      </div>
    </DashboardPageShell>
  )
}
