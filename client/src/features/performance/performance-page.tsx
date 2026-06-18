import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { PerformanceStatCard } from "./components/performance-stat-card"
import { PerformanceScoreTrend } from "./components/performance-score-trend"
import { PerformanceByDomain } from "./components/performance-by-domain"
import { PerformanceStrengthsFocus } from "./components/performance-strengths-focus"
import {
  PERFORMANCE_STATS,
  SCORE_TREND,
  DOMAIN_SCORES,
  STRENGTHS,
  FOCUS_AREAS,
  TIME_RANGE_OPTIONS,
  type TimeRange,
} from "./constants"

export function PerformancePageContent() {
  const { t } = useTranslation("common")
  const [timeRange, setTimeRange] = useState<TimeRange>("last90")

  return (
    <DashboardPageShell title={t("performance.title")}>
      <div className="flex flex-col gap-4">
        <DashboardPageHeader
          title={t("performance.title")}
          description={t("performance.description")}
          actions={
            <>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="h-8 w-auto gap-1.5 px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{t(`performance.timeRange.${r}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer">
                <Download className="size-4" />
                <span className="hidden sm:inline">{t("performance.export")}</span>
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {PERFORMANCE_STATS.map((stat) => (
            <PerformanceStatCard key={stat.id} stat={stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <PerformanceScoreTrend data={SCORE_TREND} currentScore={80} delta={6} />
          <PerformanceByDomain domains={DOMAIN_SCORES} />
        </div>

        <PerformanceStrengthsFocus strengths={STRENGTHS} focusAreas={FOCUS_AREAS} />
      </div>
    </DashboardPageShell>
  )
}
