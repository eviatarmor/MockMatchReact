import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { AutofillExtensionBanner } from "./components/autofill-extension-banner"
import { AutofillStatCard } from "./components/autofill-stat-card"
import { AutofillActivityTable } from "./components/autofill-activity-table"
import { AUTOFILL_STATS, MOCK_ACTIVITY } from "./constants"

export function AutofillPageContent() {
  const { t } = useTranslation("common")

  return (
    <DashboardPageShell title={t("autofill.title")}>
      <div className="flex flex-col gap-4">
        <DashboardPageHeader
          title={t("autofill.title")}
          description={t("autofill.description")}
        />

        <AutofillExtensionBanner />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {AUTOFILL_STATS.map((stat) => (
            <AutofillStatCard key={stat.id} stat={stat} />
          ))}
        </div>

        <AutofillActivityTable rows={MOCK_ACTIVITY} />
      </div>
    </DashboardPageShell>
  )
}
