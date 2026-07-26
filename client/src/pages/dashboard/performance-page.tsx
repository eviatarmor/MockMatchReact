import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { PerformancePageContent } from "@/features/performance/performance-page"

export function PerformancePage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("performance.documentTitle"))

  return <PerformancePageContent />
}