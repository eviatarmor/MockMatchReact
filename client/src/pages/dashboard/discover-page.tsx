import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { DiscoverPageContent } from "@/features/discover/discover-page"

export function DiscoverPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("discover.documentTitle"))

  return <DiscoverPageContent />
}