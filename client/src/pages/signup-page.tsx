import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { SignupPageContent } from "@/features/signup/signup-page"

export function SignupPage() {
  const { t } = useTranslation("signup")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <SignupPageContent />
}
