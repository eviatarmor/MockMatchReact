import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { LoginPageContent } from "@/features/login/login-page"

export function LoginPage() {
  const { t } = useTranslation("login")
  useDocumentTitle(t("documentTitle"))

  return <LoginPageContent />
}