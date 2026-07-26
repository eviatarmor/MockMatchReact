import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { BillingPageContent } from "@/features/billing/billing-page"

export function BillingPage() {
  const { t } = useTranslation("billing")
  useDocumentTitle(t("documentTitle"))

  return <BillingPageContent />
}