import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

export function HomePage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("appName")
  }, [t])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="max-w-xl text-4xl font-bold leading-tight">{t("heroHeadline.title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("heroHeadline.description")}</p>
      <Link
        to="/login"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        {t("signIn")}
      </Link>
    </div>
  )
}
