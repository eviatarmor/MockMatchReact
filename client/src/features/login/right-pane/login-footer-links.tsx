import { useTranslation } from "react-i18next"

export function LoginFooterLinks() {
  const { t } = useTranslation("login")

  return (
    <>
      <p className="text-center text-sm text-muted-foreground">
        {t("signUpPrompt")}{" "}
        <a href="#" className="font-medium text-primary hover:underline">
          {t("signUpLabel")}
        </a>
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
