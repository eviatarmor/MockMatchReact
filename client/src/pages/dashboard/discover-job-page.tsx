import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { JobDetailPageContent } from "@/features/discover/job-detail-page"

export function DiscoverJobPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("discover.jobPage.documentTitle"))

  return <JobDetailPageContent />
}
