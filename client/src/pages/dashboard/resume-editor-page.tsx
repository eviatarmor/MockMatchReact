import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ResumeEditorPageContent } from "@/features/resume-editor/resume-editor-page"

export function ResumeEditorPage() {
  const { t } = useTranslation("resume-editor")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <ResumeEditorPageContent />
}
