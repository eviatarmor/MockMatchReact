import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { ReadinessPageContent } from "@/features/readiness/readiness-page"

export function ReadinessPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("readiness.documentTitle"))

  return <ReadinessPageContent />
}