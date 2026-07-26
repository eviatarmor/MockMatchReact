import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { PrivacyPageContent } from "@/features/privacy/privacy-page"

export function PrivacyPage() {
  const { t } = useTranslation("privacy")
  useDocumentTitle(t("documentTitle"))

  return <PrivacyPageContent />
}