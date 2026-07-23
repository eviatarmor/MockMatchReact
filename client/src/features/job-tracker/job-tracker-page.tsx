import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DiscoverTab } from "./components/discover-tab"
import { useDiscoverJobs } from "./hooks/use-discover-jobs"

export function JobTrackerPageContent() {
  const { t } = useTranslation("common")
  const discover = useDiscoverJobs()

  return (
    <DashboardPageShell title={t("discover.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("discover.title")}
          description={t("discover.description")}
        />
        <DiscoverTab state={discover} />
      </div>
    </DashboardPageShell>
  )
}
