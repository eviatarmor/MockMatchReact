import { useTranslation } from "react-i18next"
import { Upload, Compass, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { DiscoverTab } from "./components/discover-tab"
import { TrackingTab } from "./components/tracking-tab"
import { AddJobDialog } from "./components/add-job-dialog"
import { MOCK_DISCOVER_JOBS, MOCK_TRACKED_JOBS } from "./constants"

export function JobTrackerPageContent() {
  const { t } = useTranslation("common")

  const actions = (
    <AddJobDialog
      trigger={
        <Button
          variant="default"
          className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
        >
          <Upload className="size-4" />
          <span className="hidden sm:inline">{t("dashboard.actions.importJob")}</span>
        </Button>
      }
    />
  )

  return (
    <DashboardPageShell
      title={t("jobTracker.title")}
      searchPlaceholder={t("dashboard.search.jobs")}
      actions={actions}
    >
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("jobTracker.title")}
          description={t("jobTracker.description")}
        />

        <Tabs defaultValue="discover">
          <TabsList variant="line">
            <TabsTrigger value="discover" className="gap-1.5 cursor-pointer">
              <Compass className="size-4" />
              {t("jobTracker.tabs.discover")}
              <Badge variant="secondary" className="rounded-full">
                {MOCK_DISCOVER_JOBS.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-1.5 cursor-pointer">
              <ClipboardList className="size-4" />
              {t("jobTracker.tabs.tracking")}
              <Badge variant="secondary" className="rounded-full">
                {MOCK_TRACKED_JOBS.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="pt-3">
            <DiscoverTab />
          </TabsContent>
          <TabsContent value="tracking" className="pt-3">
            <TrackingTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageShell>
  )
}
