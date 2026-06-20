import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { CoverLetterEditorPageContent } from "@/features/cover-letter-editor/cover-letter-editor-page"

export function CoverLetterEditorPage() {
  const { t } = useTranslation("cover-letter-editor")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <CoverLetterEditorPageContent />
}
