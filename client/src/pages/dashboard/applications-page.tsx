import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { ApplicationsPageContent } from "@/features/applications/applications-page"

export function ApplicationsPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("applications.documentTitle"))

  return <ApplicationsPageContent />
}