import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { CoverLetterTemplatesPageContent } from "@/features/cover-letters/cover-letter-templates-page"

export function CoverLetterTemplatesPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("coverLetters.templates.browseTitle")
  }, [t])

  return <CoverLetterTemplatesPageContent />
}
