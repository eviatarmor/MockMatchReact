import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { ApplicationsPageContent } from "@/features/applications/applications-page"

export function ApplicationsPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("applications.documentTitle")
  }, [t])

  return <ApplicationsPageContent />
}
