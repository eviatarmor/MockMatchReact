import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { QuestionBankPageContent } from "@/features/question-bank/question-bank-page"

export function QuestionBankPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("questionBank.documentTitle"))

  return <QuestionBankPageContent />
}