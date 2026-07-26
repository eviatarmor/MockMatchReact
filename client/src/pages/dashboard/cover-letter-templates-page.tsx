import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { CoverLetterTemplatesPageContent } from "@/features/cover-letters/cover-letter-templates-page"

export function CoverLetterTemplatesPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("coverLetters.templates.browseTitle"))

  return <CoverLetterTemplatesPageContent />
}