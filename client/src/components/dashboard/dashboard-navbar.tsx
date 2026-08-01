import { useTranslation } from "react-i18next"
import { Link, useLocation, matchPath } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@mockmatch/ui/breadcrumb"
import { useNavbarSlotsValue } from "@/hooks/use-navbar-slots"
import { NAV_DATA } from "@/components/dashboard/constants"
import type { NavItem } from "@/components/dashboard/types"
import { FeedbackButton } from "./feedback-button"
import { NavbarAskButton } from "./navbar-ask-button"
import { NavbarGetCreditsButton } from "./navbar-get-credits-button"
import { NotificationBell } from "./notification-bell"
import { ThemeToggle } from "./theme-toggle"

interface DashboardNavbarProps {
  readonly rounded?: boolean
}

/** Map editor / nested routes to their list-page nav item. */
function resolveNavItem(pathname: string): NavItem | undefined {
  if (matchPath("/resumes/:resumeId", pathname)) {
    return NAV_DATA.find((item) => item.href === "/resume-lab")
  }
  if (
    matchPath("/cover-letters/:letterId", pathname) &&
    !matchPath("/cover-letters/templates", pathname)
  ) {
    return NAV_DATA.find((item) => item.href === "/cover-letters")
  }
  const withHref = NAV_DATA.filter(
    (item): item is NavItem & { href: string } => Boolean(item.href)
  ).sort((a, b) => b.href.length - a.href.length)

  return withHref.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}

export function DashboardNavbar({ rounded = false }: DashboardNavbarProps) {
  const { t } = useTranslation("common")
  const { pathname } = useLocation()
  const { crumb, center, end } = useNavbarSlotsValue()

  const currentItem = resolveNavItem(pathname)

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-neutral-50 px-6 text-foreground dark:bg-neutral-950",
        rounded && "rounded-t-xl"
      )}
    >
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{t("appName")}</span>
          </BreadcrumbItem>
          {currentItem?.title && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb ? (
                  <BreadcrumbLink render={<Link to={currentItem.href ?? "/"} />}>
                    {t(currentItem.title)}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{t(currentItem.title)}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {crumb && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{crumb}</BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-1 items-center justify-center">{center}</div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {end}
        {/* Right → left: Credits, Ask, Feedback, Theme, notifications */}
        <NotificationBell />
        <ThemeToggle />
        <FeedbackButton />
        <NavbarAskButton />
        <NavbarGetCreditsButton />
      </div>
    </header>
  )
}
