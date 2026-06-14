import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { JobTrackerPageContent } from "@/features/job-tracker/job-tracker-page"

export function JobTrackerPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("jobTracker.documentTitle")
  }, [t])

  return <JobTrackerPageContent />
}
