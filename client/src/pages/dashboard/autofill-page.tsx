import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { AutofillPageContent } from "@/features/autofill/autofill-page"

export function AutofillPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("autofill.documentTitle"))

  return <AutofillPageContent />
}