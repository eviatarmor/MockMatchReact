import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ResumeLabPageContent } from "@/features/resume-lab/resume-lab-page"

export function ResumeLabPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("resumeLab.documentTitle")
  }, [t])

  return <ResumeLabPageContent />
}
