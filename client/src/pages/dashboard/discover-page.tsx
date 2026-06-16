import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { JobTrackerPageContent } from "@/features/job-tracker/job-tracker-page"

export function DiscoverPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("discover.documentTitle")
  }, [t])

  return <JobTrackerPageContent />
}
