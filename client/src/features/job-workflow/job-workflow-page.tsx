import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { RecorderBanner } from "./components/recorder-banner"
import { StatCard } from "@/components/data/stat-card"
import { RecorderLatestInterview } from "./components/recorder-latest-interview"
import { RecorderSettings } from "./components/recorder-settings"
import { RecorderInterviewsTable } from "./components/recorder-interviews-table"
import { RECORDER_STATS, RECORDED_INTERVIEWS } from "./constants"

export function JobWorkflowPageContent() {
  const { t } = useTranslation("common")

  return (
    <DashboardPageShell title={t("recorder.title")}>
      <div className="flex flex-col gap-4">
        <DashboardPageHeader
          title={t("recorder.title")}
          description={t("recorder.description")}
        />

        <RecorderBanner />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {RECORDER_STATS.map((stat) => (
            <StatCard key={stat.id} iconName={stat.iconName} label={t(stat.labelKey)} value={stat.value} subValue={stat.subValue} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <RecorderLatestInterview />
          <RecorderSettings />
        </div>

        <RecorderInterviewsTable rows={RECORDED_INTERVIEWS} />
      </div>
    </DashboardPageShell>
  )
}
