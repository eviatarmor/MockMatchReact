import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { ResumeTemplatesPageContent } from "@/features/resume-lab/resume-templates-page"

export function ResumeTemplatesPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("resumeLab.templates.browseTitle"))

  return <ResumeTemplatesPageContent />
}