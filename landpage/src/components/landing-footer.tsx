import { useTranslation } from "react-i18next"
import { AppLogo } from "./app-logo"
import { appPath, CHANGELOG_HREF, DOCS_URL } from "../constants"

export function LandingFooter() {
  const { t } = useTranslation("landing")
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--lp-line)] bg-[var(--lp-canvas)] pt-16 pb-10">
      <div className="lp-container grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 font-semibold tracking-tight text-[var(--lp-ink)]">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary p-1.5">
              <AppLogo className="size-full" />
            </span>
            {t("appName")}
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--lp-muted)]">
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <h3 className="text-[0.75rem] font-medium tracking-wide text-[var(--lp-faint)]">
            {t("footer.product")}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href="#features"
                className="text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
              >
                {t("nav.features")}
              </a>
            </li>
            <li>
              <a
                href="#integrations"
                className="text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
              >
                {t("nav.integrations")}
              </a>
            </li>
            <li>
              <a
                href={appPath("/signup")}
                className="text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
              >
                {t("footer.signup")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[0.75rem] font-medium tracking-wide text-[var(--lp-faint)]">
            {t("footer.resources")}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
              >
                {t("footer.docs")}
              </a>
            </li>
            <li>
              <a
                href={CHANGELOG_HREF}
                className="text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
              >
                {t("footer.changelog")}
              </a>
            </li>
            <li>
              <a
                href="#faq"
                className="text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
              >
                {t("nav.faq")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[0.75rem] font-medium tracking-wide text-[var(--lp-faint)]">
            {t("footer.company")}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href={appPath("/login")}
                className="text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
              >
                {t("footer.login")}
              </a>
            </li>
            <li>
              <a
                href={appPath("/signup")}
                className="text-[var(--lp-muted)] transition-colors hover:text-[var(--lp-ink)]"
              >
                {t("footer.signup")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="lp-container mt-14 border-t border-[var(--lp-line)] pt-6">
        <p className="text-[0.75rem] text-[var(--lp-faint)]">
          {t("footer.copyright", { year })}
        </p>
      </div>
    </footer>
  )
}
