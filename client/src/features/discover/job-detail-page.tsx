import { useEffect, useMemo } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTrackedJobs } from "@/features/applications/hooks/use-tracked-jobs"
import { JobDetailsPanel } from "./components/job-details-panel"
import { cacheJobSnapshot, readJobSnapshot } from "./lib/job-snapshot"
import { trackedJobToDiscover } from "./lib/tracked-to-discover"
import type { DiscoverJob } from "./types"

interface JobDetailLocationState {
  readonly job?: DiscoverJob
  /** Where “Back” should go (default Discover). */
  readonly backTo?: string
}

export function JobDetailPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const location = useLocation()
  const { jobId } = useParams<{ jobId: string }>()
  const { jobs: trackedJobs } = useTrackedJobs()

  const state = (location.state ?? null) as JobDetailLocationState | null
  const backTo = state?.backTo ?? "/discover"

  const job = useMemo(() => {
    if (!jobId) return null

    if (state?.job && state.job.id === jobId) return state.job

    const cached = readJobSnapshot(jobId)
    if (cached) return cached

    const tracked = trackedJobs.find((row) => row.id === jobId)
    if (tracked) return trackedJobToDiscover(tracked)

    return null
  }, [jobId, state?.job, trackedJobs])

  useEffect(() => {
    if (job) cacheJobSnapshot(job)
  }, [job])

  const backLabel =
    backTo.startsWith("/applications")
      ? t("discover.jobPage.backToApplications")
      : t("discover.jobPage.backToDiscover")

  if (!job) {
    return (
      <DashboardPageShell title={t("discover.jobPage.title")}>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t("discover.jobPage.notFound")}
          </p>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => navigate("/discover")}
          >
            {t("discover.jobPage.backToDiscover")}
          </Button>
        </div>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell title={`${job.title} — ${job.company}`}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </button>

        {/* Fixed card height so PanelShell footer pins to bottom (same idea as Discover pane). */}
        <Card className="flex h-[calc(100svh-8.5rem)] flex-col overflow-hidden py-0 ring-foreground/10 hover:ring-foreground/10">
          <div className="min-h-0 flex-1">
            <JobDetailsPanel job={job} variant="page" />
          </div>
        </Card>
      </div>
    </DashboardPageShell>
  )
}
