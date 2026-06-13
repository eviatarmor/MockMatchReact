import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export function ForgotPasswordFooterLinks() {
  const { t } = useTranslation("forgot-password")

  return (
    <Link
      to="/login"
      className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <ArrowLeft className="size-4" />
      {t("backToSignInLabel")}
    </Link>
  )
}
