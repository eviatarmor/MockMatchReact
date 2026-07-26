import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { JobWorkflowPageContent } from "@/features/job-workflow/job-workflow-page"

export function InterviewRecorderPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("recorder.documentTitle"))

  return <JobWorkflowPageContent />
}