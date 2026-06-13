import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export function LoginFooterLinks() {
  const { t } = useTranslation("login")

  return (
    <>
      <p className="text-center text-sm text-muted-foreground">
        {t("signUpPrompt")}{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          {t("signUpLabel")}
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        {t("termsPrefix")}{" "}
        <a href="#" className="underline">
          {t("termsLabel")}
        </a>{" "}
        and{" "}
        <a href="#" className="underline">
          {t("privacyLabel")}
        </a>
        .
      </p>
    </>
  )
}
