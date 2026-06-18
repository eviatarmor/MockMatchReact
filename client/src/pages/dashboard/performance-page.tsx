import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { PerformancePageContent } from "@/features/performance/performance-page"

export function PerformancePage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("performance.documentTitle")
  }, [t])

  return <PerformancePageContent />
}
