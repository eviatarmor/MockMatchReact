import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AppLogo } from "@/components/icons/app-logo"
import { CHANGELOG_HREF, DOCS_URL } from "../constants"

export function LandingFooter() {
  const { t } = useTranslation(["landing", "common"])
  const year = new Date().getFullYear()

  return (
    <footer className="bg-muted/30 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary p-1">
              <AppLogo className="size-full" />
            </span>
            {t("common:appName")}
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("footer.product")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="#features" className="text-foreground/80 hover:text-foreground">
                {t("nav.features")}
              </a>
            </li>
            <li>
              <a href="#integrations" className="text-foreground/80 hover:text-foreground">
                {t("nav.integrations")}
              </a>
            </li>
            <li>
              <Link to="/signup" className="text-foreground/80 hover:text-foreground">
                {t("footer.signup")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("footer.resources")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground"
              >
                {t("footer.docs")}
              </a>
            </li>
            <li>
              <a href={CHANGELOG_HREF} className="text-foreground/80 hover:text-foreground">
                {t("footer.changelog")}
              </a>
            </li>
            <li>
              <a href="#faq" className="text-foreground/80 hover:text-foreground">
                {t("nav.faq")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("footer.company")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/login" className="text-foreground/80 hover:text-foreground">
                {t("footer.login")}
              </Link>
            </li>
            <li>
              <Link to="/signup" className="text-foreground/80 hover:text-foreground">
                {t("footer.signup")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-border/60 px-4 pt-6 sm:px-6">
        <p className="text-xs text-muted-foreground">
          {t("footer.copyright", { year })}
        </p>
      </div>
    </footer>
  )
}
