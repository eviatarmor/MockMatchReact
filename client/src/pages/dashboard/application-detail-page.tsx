import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { ApplicationDetailPageContent } from "@/features/application-detail/application-detail-page"

export function ApplicationDetailPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("applicationDetail.documentTitle"))

  return <ApplicationDetailPageContent />
}