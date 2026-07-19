import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { ResumeTemplatesPageContent } from "@/features/resume-lab/resume-templates-page"

export function ResumeTemplatesPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("resumeLab.templates.browseTitle")
  }, [t])

  return <ResumeTemplatesPageContent />
}
