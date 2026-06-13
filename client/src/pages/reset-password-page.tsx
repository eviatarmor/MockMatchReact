import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { ResetPasswordPageContent } from "@/features/reset-password/reset-password-page"

export function ResetPasswordPage() {
  const { t } = useTranslation("reset-password")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <ResetPasswordPageContent />
}
