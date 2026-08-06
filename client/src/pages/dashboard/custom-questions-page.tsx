import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { CustomQuestionsPageContent } from "@/features/custom-questions/custom-questions-page"

export function CustomQuestionsPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("customQuestions.documentTitle"))

  return <CustomQuestionsPageContent />
}
