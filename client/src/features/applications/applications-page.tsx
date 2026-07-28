import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Bookmark, Upload } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import {
  ViewModeTabs,
  type ListViewMode,
} from "@/components/data/view-mode-tabs"
import { TrackingKanban } from "./components/tracking-kanban"
import { ApplicationsTable } from "./components/applications-table"
import { EmailConnectBar } from "./components/email-connect-bar"
import { ApplicationsWelcomeDialog } from "./components/applications-welcome-dialog"
import { ApplicationsTour } from "./components/applications-tour"
import { AddJobDialog } from "@/features/discover/components/add-job-dialog"
import { useTrackedJobs, useEmailConnect } from "./hooks/use-tracked-jobs"
import { useApplicationsOnboarding } from "./hooks/use-applications-onboarding"
import type { EmailProvider } from "./types"

export function ApplicationsPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ListViewMode>("table")
  const { jobs, addFromPaste, untrack, replaceStatuses, updateStatus } = useTrackedJobs()
  const { connectedProvider, connect, disconnect } = useEmailConnect()
  const {
    welcomeOpen,
    tourOpen,
    startTour,
    skipWelcome,
    setTourOpen,
  } = useApplicationsOnboarding()

  const filteredJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(search.toLowerCase()) ||
          job.company.toLowerCase().includes(search.toLowerCase())
      ),
    [jobs, search]
  )

  const isEmpty = filteredJobs.length === 0 && search.trim() === ""
  const noSearchHits = filteredJobs.length === 0 && search.trim() !== ""

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
            <ViewModeTabs value={viewMode} onValueChange={setViewMode} />
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
          ) : noSearchHits ? (
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
