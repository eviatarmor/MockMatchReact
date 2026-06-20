import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { ApplicationDetailPageContent } from "@/features/application-detail/application-detail-page"

export function ApplicationDetailPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("applicationDetail.documentTitle")
  }, [t])

  return <ApplicationDetailPageContent />
}
