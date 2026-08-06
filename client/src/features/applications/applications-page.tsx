import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Bookmark, Upload } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { TableDisplayMenu } from "@/components/data/table-display-menu"
import { TableFilterMenu } from "@/components/data/table-filter-menu"
import {
  ViewModeTabs,
  type ListViewMode,
} from "@/components/data/view-mode-tabs"
import { useTableColumnVisibility } from "@/hooks/use-table-column-visibility"
import { useTableFilters } from "@/hooks/use-table-filters"
import { TrackingKanban } from "./components/tracking-kanban"
import { ApplicationsTable } from "./components/applications-table"
import { EmailConnectBar } from "./components/email-connect-bar"
import { ApplicationsWelcomeDialog } from "./components/applications-welcome-dialog"
import { ApplicationsTour } from "./components/applications-tour"
import { AddJobDialog } from "@/features/discover/components/add-job-dialog"
import { useTrackedJobs, useEmailConnect } from "./hooks/use-tracked-jobs"
import { useApplicationsOnboarding } from "./hooks/use-applications-onboarding"
import { TRACKING_STATUS_ORDER } from "./constants"
import type { EmailProvider } from "./types"

export function ApplicationsPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ListViewMode>("table")
  const tableFilters = useTableFilters()
  const { jobs, addFromPaste, untrack, replaceStatuses, updateStatus } = useTrackedJobs()
  const { connectedProvider, connect, disconnect } = useEmailConnect()
  const {
    welcomeOpen,
    tourOpen,
    startTour,
    skipWelcome,
    setTourOpen,
  } = useApplicationsOnboarding()

  const displayColumns = useMemo(
    () => [
      { id: "job", label: t("applications.table.columns.job"), locked: true },
      { id: "status", label: t("applications.table.columns.status") },
      { id: "match", label: t("applications.table.columns.match") },
      { id: "location", label: t("applications.table.columns.location") },
      { id: "nextStep", label: t("applications.table.columns.nextStep") },
      { id: "actions", label: t("tableChrome.actions"), locked: true },
    ],
    [t]
  )
  const columnVisibility = useTableColumnVisibility(displayColumns)

  const filterFields = useMemo(
    () => [
      {
        id: "status",
        label: t("applications.table.columns.status"),
        options: TRACKING_STATUS_ORDER.map((value) => ({
          value,
          label: t(`applications.statusLabels.${value}`),
        })),
      },
    ],
    [t]
  )

  const searchedJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          job.company.toLowerCase().includes(search.toLowerCase())
      ),
    [jobs, search]
  )

  const filteredJobs = useMemo(
    () =>
      tableFilters.filterItems(
        searchedJobs,
        (item, fieldId) => (fieldId === "status" ? item.status : null)
      ),
    [searchedJobs, tableFilters.filterItems]
  )

  const hasActiveQuery = search.trim() !== "" || tableFilters.hasActive
  const isEmpty = filteredJobs.length === 0 && !hasActiveQuery
  const noQueryHits = filteredJobs.length === 0 && hasActiveQuery

  function handleImport(description: string) {
    const tracked = addFromPaste(description)
    toast.success(t("applications.addJob.successToast"), {
      description: tracked.title,
    })
  }

  function handleConnect(provider: EmailProvider) {
    connect(provider)
    toast.success(
      t("applications.email.connectedToast", {
        provider: t(`applications.email.providers.${provider}`),
      })
    )
  }

  function handleDisconnect() {
    disconnect()
    toast.success(t("applications.email.disconnectedToast"))
  }

  return (
    <DashboardPageShell title={t("applications.title")}>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <DashboardPageHeader
          title={t("applications.title")}
          description={t("applications.description")}
          actions={
            <div id="applications-tour-email">
              <EmailConnectBar
                connectedProvider={connectedProvider}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>
          }
        />

        <TableToolbar
          searchPlaceholder={t("dashboard.search.applications")}
          search={search}
          onSearchChange={setSearch}
          filters={
            <>
              <TableFilterMenu
                fields={filterFields}
                isValueSelected={tableFilters.isValueSelected}
                onToggleValue={tableFilters.toggleValue}
                onClearAll={tableFilters.clearAll}
                activeCount={tableFilters.activeCount}
              />
              {viewMode === "table" ? (
                <TableDisplayMenu
                  columns={displayColumns}
                  isVisible={columnVisibility.isVisible}
                  onToggle={columnVisibility.toggle}
                />
              ) : null}
              <ViewModeTabs value={viewMode} onValueChange={setViewMode} />
            </>
          }
          actions={
            <div id="applications-tour-import">
              <AddJobDialog
                onAdd={handleImport}
                trigger={
                  <Button
                    variant="default"
                    className="h-8 w-8 cursor-pointer gap-1.5 px-0 sm:w-auto sm:px-3"
                  >
                    <Upload className="size-4" />
                    <span className="hidden sm:inline">
                      {t("dashboard.actions.importJob")}
                    </span>
                  </Button>
                }
              />
            </div>
          }
        />

        <div id="applications-tour-board" className="flex min-h-0 flex-1 flex-col">
          {isEmpty ? (
            <EntityEmptyState
              icon={Bookmark}
              title={t("applications.empty.title")}
              description={t("applications.empty.description")}
            />
          ) : noQueryHits ? (
            <EntityEmptyState
              icon={Bookmark}
              title={t("applications.empty.noSearchTitle")}
              description={t("applications.empty.noSearchDescription")}
            />
          ) : viewMode === "table" ? (
            <ApplicationsTable
              jobs={filteredJobs}
              onStatusChange={updateStatus}
              onRemove={untrack}
              isColumnVisible={columnVisibility.isVisible}
            />
          ) : (
            <TrackingKanban
              jobs={filteredJobs}
              onStatusesChange={replaceStatuses}
              onRemove={untrack}
            />
          )}
        </div>
      </div>

      <ApplicationsWelcomeDialog
        open={welcomeOpen}
        onStartTour={startTour}
        onSkip={skipWelcome}
      />
      <ApplicationsTour open={tourOpen} onOpenChange={setTourOpen} />
    </DashboardPageShell>
  )
}
