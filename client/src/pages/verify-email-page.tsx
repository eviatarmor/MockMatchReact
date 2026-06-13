import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { VerifyEmailPageContent } from "@/features/verify-email/verify-email-page"

export function VerifyEmailPage() {
  const { t } = useTranslation("verify-email")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <VerifyEmailPageContent />
}
