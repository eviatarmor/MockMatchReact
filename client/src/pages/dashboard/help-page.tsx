import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { HelpPageContent } from "@/features/help/help-page"

export function HelpPage() {
  const { t } = useTranslation("help")
  useDocumentTitle(t("documentTitle"))

  return <HelpPageContent />
}
