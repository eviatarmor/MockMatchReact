import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { AssessmentsPageContent } from "@/features/assessments/assessments-page"

export function AssessmentsPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("assessments.documentTitle")
  }, [t])

  return <AssessmentsPageContent />
}
