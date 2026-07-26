import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { SignupPageContent } from "@/features/signup/signup-page"

export function SignupPage() {
  const { t } = useTranslation("signup")
  useDocumentTitle(t("documentTitle"))

  return <SignupPageContent />
}