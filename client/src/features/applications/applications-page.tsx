import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Bookmark, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { TrackingKanban } from "./components/tracking-kanban"
import { EmailConnectBar } from "./components/email-connect-bar"
import { AddJobDialog } from "@/features/discover/components/add-job-dialog"
import { useTrackedJobs, useEmailConnect } from "./hooks/use-tracked-jobs"
import type { EmailProvider } from "./types"

export function ApplicationsPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")
  const { jobs, addFromPaste, untrack, replaceStatuses } = useTrackedJobs()
  const { connectedProvider, connect, disconnect } = useEmailConnect()

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
      <div className="flex flex-1 flex-col gap-3 min-h-0">
        <DashboardPageHeader
          title={t("applications.title")}
          description={t("applications.description")}
          actions={
            <EmailConnectBar
              connectedProvider={connectedProvider}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          }
        />

        <TableToolbar
          searchPlaceholder={t("dashboard.search.applications")}
          search={search}
          onSearchChange={setSearch}
          actions={
            <AddJobDialog
              onAdd={handleImport}
              trigger={
                <Button
                  variant="default"
                  className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
                >
                  <Upload className="size-4" />
                  <span className="hidden sm:inline">
                    {t("dashboard.actions.importJob")}
                  </span>
                </Button>
              }
            />
          }
        />

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
        ) : (
          <TrackingKanban
            jobs={filteredJobs}
            onStatusesChange={replaceStatuses}
            onRemove={untrack}
          />
        )}
      </div>
    </DashboardPageShell>
  )
}
