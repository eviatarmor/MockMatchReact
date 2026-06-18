import { useTranslation } from "react-i18next"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { SimulationTrackCard } from "./components/simulation-track-card"
import { SimulationRecentSessions } from "./components/simulation-recent-sessions"
import { INTERVIEW_TRACKS, MOCK_RECENT_SESSIONS } from "./constants"

export function SimulationsPageContent() {
  const { t } = useTranslation("common")

  return (
    <DashboardPageShell title={t("simulations.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("simulations.title")}
          description={t("simulations.description")}
          actions={
            <Button variant="outline" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer">
              <Settings2 className="size-4" />
              <span className="hidden sm:inline">{t("simulations.configureRole")}</span>
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {INTERVIEW_TRACKS.map((track) => (
            <SimulationTrackCard key={track.id} track={track} />
          ))}
        </div>

        <SimulationRecentSessions sessions={MOCK_RECENT_SESSIONS} />
      </div>
    </DashboardPageShell>
  )
}
