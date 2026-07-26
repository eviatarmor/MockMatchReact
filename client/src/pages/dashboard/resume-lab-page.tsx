import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { ResumeLabPageContent } from "@/features/resume-lab/resume-lab-page"

export function ResumeLabPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("resumeLab.documentTitle"))

  return <ResumeLabPageContent />
}