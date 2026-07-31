import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { NotFoundPageContent } from "@/features/not-found/not-found-page"

export function NotFoundPage() {
  const { t } = useTranslation("not-found")
  useDocumentTitle(t("documentTitle"))

  return <NotFoundPageContent />
}
