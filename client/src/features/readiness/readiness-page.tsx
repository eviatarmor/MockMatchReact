import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { ReadinessScoreRing } from "./components/readiness-score-ring"
import { ReadinessStatCard } from "./components/readiness-stat-card"
import { ReadinessByArea } from "./components/readiness-by-area"
import { ReadinessNextUp } from "./components/readiness-next-up"
import { OVERALL_SCORE, READINESS_AREAS, NEXT_UP_ITEMS } from "./constants"

export function ReadinessPageContent() {
  const { t } = useTranslation("common")

  return (
    <DashboardPageShell title={t("readiness.title")}>
      <div className="flex flex-col gap-4">
        <DashboardPageHeader
          title={t("readiness.title")}
          description={t("readiness.description")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessScoreRing score={OVERALL_SCORE} delta={8} />
          <ReadinessStatCard icon="Briefcase" value={24} label={t("readiness.stats.activeApplications")} sublabel={t("readiness.stats.thisWeek", { count: 6 })} />
          <ReadinessStatCard icon="Mic2"      value={18} label={t("readiness.stats.mockInterviews")}    sublabel={t("readiness.stats.completed")} />
          <ReadinessStatCard icon="Sparkles"  value={2}  label={t("readiness.stats.offers")}            sublabel="" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <ReadinessByArea areas={READINESS_AREAS} />
          <ReadinessNextUp items={NEXT_UP_ITEMS} />
        </div>
      </div>
    </DashboardPageShell>
  )
}
