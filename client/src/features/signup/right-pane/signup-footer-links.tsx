import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export function SignupFooterLinks() {
  const { t } = useTranslation("signup")

  return (
    <p className="text-center text-sm text-muted-foreground">
      {t("signInPrompt")}{" "}
      <Link to="/login" className="font-medium text-primary hover:underline">
        {t("signInLabel")}
      </Link>
    </p>
  )
}
