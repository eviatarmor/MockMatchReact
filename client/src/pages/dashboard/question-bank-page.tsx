import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { QuestionBankPageContent } from "@/features/question-bank/question-bank-page"

export function QuestionBankPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("questionBank.documentTitle")
  }, [t])

  return <QuestionBankPageContent />
}
