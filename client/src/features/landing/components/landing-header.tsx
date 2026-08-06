import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Menu, X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { AppLogo } from "@/components/icons/app-logo"
import { CHANGELOG_HREF, DOCS_URL } from "../constants"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "#features", labelKey: "nav.features" },
  { href: "#integrations", labelKey: "nav.integrations" },
  { href: "#faq", labelKey: "nav.faq" },
  { href: DOCS_URL, labelKey: "nav.docs", external: true },
  { href: CHANGELOG_HREF, labelKey: "nav.changelog" },
] as const

export function LandingHeader() {
  const { t } = useTranslation(["landing", "common"])
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary p-1">
            <AppLogo className="size-full" />
          </span>
          <span className="text-sm sm:text-base">{t("common:appName")}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) =>
            "external" in link && link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {t(link.labelKey)}
              </a>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            className="hidden sm:inline-flex"
            nativeButton={false}
            render={<Link to="/login" />}
          >
            {t("nav.login")}
          </Button>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link to="/signup" />}
          >
            {t("nav.signup")}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
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
          "border-t border-border/60 bg-background md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
          {NAV_LINKS.map((link) =>
            "external" in link && link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {t(link.labelKey)}
              </a>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {t(link.labelKey)}
              </a>
            )
          )}
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted sm:hidden"
            onClick={() => setOpen(false)}
          >
            {t("nav.login")}
          </Link>
        </nav>
      </div>
    </header>
  )
}
