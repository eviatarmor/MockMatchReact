import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { LoginPageContent } from "@/features/login/login-page"

export function LoginPage() {
  const { t } = useTranslation("login")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <LoginPageContent />
}
