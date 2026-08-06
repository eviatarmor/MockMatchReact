import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Menu, X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { cn } from "@mockmatch/ui/utils"
import { AppLogo } from "./app-logo"
import { appPath, CHANGELOG_HREF, DOCS_URL } from "../constants"

const NAV_LINKS = [
  { href: "#product-demos", labelKey: "nav.demos" },
  { href: "#features", labelKey: "nav.features" },
  { href: "#integrations", labelKey: "nav.integrations" },
  { href: "#faq", labelKey: "nav.faq" },
  { href: DOCS_URL, labelKey: "nav.docs", external: true },
  { href: CHANGELOG_HREF, labelKey: "nav.changelog" },
] as const

// fallow-ignore-next-line complexity
export function LandingHeader() {
  const { t } = useTranslation("landing")
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-[var(--lp-line)] bg-white/80 shadow-[var(--lp-shadow-sm)] backdrop-blur-xl">
        <div className="lp-container flex h-16 items-center justify-between gap-4">
          <a
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-[var(--lp-ink)]"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary p-1.5 shadow-[var(--lp-shadow-sm)]">
              <AppLogo className="size-full" />
            </span>
            <span className="text-[0.9375rem]">{t("appName")}</span>
          </a>

          <nav
            className="hidden items-center gap-0.5 md:flex"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-[var(--lp-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--lp-ink)]"
                >
                  {t(link.labelKey)}
                </a>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3.5 py-2 text-[0.8125rem] font-medium text-[var(--lp-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--lp-ink)]"
                >
                  {t(link.labelKey)}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden h-9 rounded-full px-3.5 text-[0.8125rem] font-medium text-[var(--lp-ink)] hover:bg-black/[0.04] sm:inline-flex"
              nativeButton={false}
              render={<a href={appPath("/login")} />}
            >
              {t("nav.login")}
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-full bg-[var(--lp-ink)] px-4 text-[0.8125rem] font-medium text-white hover:bg-[var(--lp-ink)]/90"
              nativeButton={false}
              render={<a href={appPath("/signup")} />}
            >
              {t("nav.signup")}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full md:hidden"
              aria-expanded={open}
              aria-controls="landing-mobile-nav"
              aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        <div
          id="landing-mobile-nav"
          className={cn(
            "border-t border-[var(--lp-line)] bg-white md:hidden",
            open ? "block" : "hidden"
          )}
        >
          <nav
            className="lp-container flex flex-col gap-0.5 py-3"
            aria-label="Mobile"
          >
            {NAV_LINKS.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--lp-ink)] hover:bg-black/[0.04]"
                  onClick={() => setOpen(false)}
                >
                  {t(link.labelKey)}
                </a>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--lp-ink)] hover:bg-black/[0.04]"
                  onClick={() => setOpen(false)}
                >
                  {t(link.labelKey)}
                </a>
              )
            )}
            <a
              href={appPath("/login")}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--lp-ink)] hover:bg-black/[0.04] sm:hidden"
              onClick={() => setOpen(false)}
            >
              {t("nav.login")}
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
