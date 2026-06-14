import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { CoverLettersPageContent } from "@/features/cover-letters/cover-letters-page"

export function CoverLettersPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("coverLetters.documentTitle")
  }, [t])

  return <CoverLettersPageContent />
}
