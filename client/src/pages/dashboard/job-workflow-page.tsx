import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { JobWorkflowPageContent } from "@/features/job-workflow/job-workflow-page"

export function JobWorkflowPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("recorder.documentTitle")
  }, [t])

  return <JobWorkflowPageContent />
}
