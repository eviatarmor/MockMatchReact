import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { AssessmentsPageContent } from "@/features/assessments/assessments-page"

export function AssessmentsPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("assessments.documentTitle"))

  return <AssessmentsPageContent />
}