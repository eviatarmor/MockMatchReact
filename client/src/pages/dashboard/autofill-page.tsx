import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { AutofillPageContent } from "@/features/autofill/autofill-page"

export function AutofillPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("autofill.documentTitle")
  }, [t])

  return <AutofillPageContent />
}
