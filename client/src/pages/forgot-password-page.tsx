import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { ForgotPasswordPageContent } from "@/features/forgot-password/forgot-password-page"

export function ForgotPasswordPage() {
  const { t } = useTranslation("forgot-password")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <ForgotPasswordPageContent />
}
