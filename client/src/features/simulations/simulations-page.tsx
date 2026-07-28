import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { History, Play } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Separator } from "@mockmatch/ui/separator"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { EntityTablePagination } from "@/components/data/entity-table-pagination"
import { SessionTable } from "./components/session-table"
import { TrackBrowserSection } from "./components/track-browser-section"
import { useSessionsList } from "./hooks/use-sessions-list"
import { FEATURED_TRACKS } from "./constants"

export function SimulationsPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const list = useSessionsList()

  const goToTracks = () => navigate("/simulations/tracks")

  const emptyState = (
    <EntityEmptyState
      icon={History}
      title={
        list.hasActiveSearch
          ? t("simulations.recentSessions.emptySearchTitle")
          : t("simulations.recentSessions.emptyTitle")
      }
      description={
        list.hasActiveSearch
          ? t("simulations.recentSessions.emptySearchDescription")
          : t("simulations.recentSessions.emptyDescription")
      }
      action={
        list.hasActiveSearch
          ? undefined
          : {
              label: t("dashboard.actions.startSimulation"),
              icon: Play,
              onClick: goToTracks,
            }
      }
    />
  )

  return (
    <DashboardPageShell title={t("simulations.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("simulations.title")}
          description={t("simulations.description")}
        />

        <TableToolbar
          searchPlaceholder={t("dashboard.search.simulations")}
          search={list.search}
          onSearchChange={list.setSearch}
          actions={
            <Button
              variant="default"
              className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
              onClick={goToTracks}
            >
              <Play className="size-4" />
              <span className="hidden sm:inline">{t("dashboard.actions.startSimulation")}</span>
            </Button>
          }
        />

        <EntityListStates
          isError={list.isError}
          isLoading={list.isLoading}
          isEmpty={list.isEmpty}
          errorMessage={t("simulations.recentSessions.loadError")}
          loadingMessage={t("simulations.recentSessions.loading")}
          emptyState={emptyState}
        >
          <SessionTable sessions={list.items} />
          <EntityTablePagination
            page={list.page}
            totalPages={list.totalPages}
            total={list.total}
            onPageChange={list.setPage}
            disabled={list.isFetching}
          />
        </EntityListStates>

        <Separator className="my-2" />
        <TrackBrowserSection
          tracks={FEATURED_TRACKS}
          browseAllTo="/simulations/tracks"
        />
      </div>
    </DashboardPageShell>
  )
}
