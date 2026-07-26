import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { CoverLettersPageContent } from "@/features/cover-letters/cover-letters-page"

export function CoverLettersPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("coverLetters.documentTitle"))

  return <CoverLettersPageContent />
}