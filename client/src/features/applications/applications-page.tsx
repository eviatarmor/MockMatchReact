import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { SearchBar } from "@/components/dashboard/search-bar"
import { TrackingTab } from "./components/tracking-tab"
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

  return (
    <DashboardPageShell
      title={t("applications.title")}
      actions={undefined}
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
