import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ReadinessPageContent } from "@/features/readiness/readiness-page"

export function ReadinessPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("readiness.documentTitle")
  }, [t])

  return <ReadinessPageContent />
}
