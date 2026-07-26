import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { ResumeEditorPageContent } from "@/features/resume-editor/resume-editor-page"

export function ResumeEditorPage() {
  const { t } = useTranslation("resume-editor")
  useDocumentTitle(t("documentTitle"))

  return <ResumeEditorPageContent />
}