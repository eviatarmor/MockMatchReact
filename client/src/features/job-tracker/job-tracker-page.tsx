import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { SearchBar } from "@/components/dashboard/search-bar"
import { DiscoverTab } from "./components/discover-tab"
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

  return (
    <DashboardPageShell
      title={t("discover.title")}
      actions={undefined}
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
