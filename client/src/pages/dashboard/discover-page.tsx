import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { DiscoverPageContent } from "@/features/discover/discover-page"

export function DiscoverPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("discover.documentTitle")
  }, [t])

  return <DiscoverPageContent />
}
