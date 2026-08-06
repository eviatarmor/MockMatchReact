import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { History, Play } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@mockmatch/ui/button"
import { Separator } from "@mockmatch/ui/separator"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { EntityTablePagination } from "@/components/data/entity-table-pagination"
import { TableChromeControls } from "@/components/data/table-chrome-controls"
import { useTableColumnVisibility } from "@/hooks/use-table-column-visibility"
import { useTableFilters } from "@/hooks/use-table-filters"
import { listEmptyCopy } from "@/lib/list-empty-copy"
import {
  buildStatusFilterField,
  statusFieldValue,
} from "@/lib/status-table-filter"
import { filterByTableFilters } from "@/lib/table-filters"
import { SessionTable } from "./components/session-table"
import { TrackBrowserSection } from "./components/track-browser-section"
import { useSessionsList } from "./hooks/use-sessions-list"
import type { RecentSession, SessionStatus } from "./types"

const SESSION_STATUSES: readonly SessionStatus[] = [
  "completed",
  "in_progress",
  "abandoned",
]

export function SimulationsPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const list = useSessionsList()
  const tableFilters = useTableFilters()

  const displayColumns = useMemo(
    () => [
      {
        id: "session",
        label: t("simulations.recentSessions.columns.session"),
        locked: true,
      },
      { id: "score", label: t("simulations.recentSessions.columns.score") },
      { id: "status", label: t("simulations.recentSessions.columns.status") },
      { id: "updated", label: t("simulations.recentSessions.columns.updated") },
      { id: "actions", label: t("tableChrome.actions"), locked: true },
    ],
    [t]
  )
  const columnVisibility = useTableColumnVisibility(displayColumns)

  const filterFields = useMemo(
    () => [
      buildStatusFilterField(
        t("simulations.recentSessions.columns.status"),
        SESSION_STATUSES.map((value) => ({
          value,
          label: t(`simulations.recentSessions.statusLabels.${value}`),
        }))
      ),
    ],
    [t]
  )

  const filteredItems = useMemo(
    () => filterByTableFilters(list.items, tableFilters.filters, statusFieldValue),
    [list.items, tableFilters.filters]
  )

  const hasActiveQuery = list.hasActiveSearch || tableFilters.hasActive
  const showEmpty = !list.isLoading && filteredItems.length === 0
  const emptyCopy = listEmptyCopy(hasActiveQuery, t, {
    emptyTitle: "simulations.recentSessions.emptyTitle",
    emptyDescription: "simulations.recentSessions.emptyDescription",
    emptySearchTitle: "simulations.recentSessions.emptySearchTitle",
    emptySearchDescription: "simulations.recentSessions.emptySearchDescription",
  })

  const goToTracks = () => navigate("/simulations/tracks")

  const handleDelete = (session: RecentSession) => {
    list.removeSession(session)
    toast.success(t("simulations.recentSessions.toast.deleted"))
  }

  const emptyState = (
    <EntityEmptyState
      icon={History}
      title={emptyCopy.title}
      description={emptyCopy.description}
      action={
        hasActiveQuery
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
          filters={
            <TableChromeControls
              filterFields={filterFields}
              isValueSelected={tableFilters.isValueSelected}
              onToggleValue={tableFilters.toggleValue}
              onClearAll={tableFilters.clearAll}
              activeCount={tableFilters.activeCount}
              displayColumns={displayColumns}
              isColumnVisible={columnVisibility.isVisible}
              onToggleColumn={columnVisibility.toggle}
            />
          }
          actions={
            <Button
              variant="default"
              className="h-8 w-8 cursor-pointer gap-1.5 px-0 sm:w-auto sm:px-3"
              onClick={goToTracks}
            >
              <Play className="size-4" />
              <span className="hidden sm:inline">
                {t("dashboard.actions.startSimulation")}
              </span>
            </Button>
          }
        />

        <EntityListStates
          isError={list.isError}
          isLoading={list.isLoading}
          isEmpty={showEmpty}
          errorMessage={t("simulations.recentSessions.loadError")}
          loadingMessage={t("simulations.recentSessions.loading")}
          emptyState={emptyState}
        >
          <SessionTable
            sessions={filteredItems}
            onDelete={handleDelete}
            deletingId={list.deletingId}
            isColumnVisible={columnVisibility.isVisible}
          />
          <EntityTablePagination
            page={list.page}
            totalPages={list.totalPages}
            total={list.total}
            onPageChange={list.setPage}
            disabled={list.isFetching}
          />
        </EntityListStates>

        <Separator className="my-2" />
        <TrackBrowserSection browseAllTo="/simulations/tracks" />
      </div>
    </DashboardPageShell>
  )
}
