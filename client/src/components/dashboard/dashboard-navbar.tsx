import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useNavbarSlotsValue } from "@/hooks/use-navbar-slots"
import { NAV_DATA } from "@/components/dashboard/constants"

export function DashboardNavbar() {
  const { t } = useTranslation("common")
  const { pathname } = useLocation()
  const { crumb, center, end } = useNavbarSlotsValue()

  const currentItem = NAV_DATA.find((item) => item.href && pathname.startsWith(item.href))

  return (
    <header className="sticky top-4 z-20 flex h-14 items-center gap-2 rounded-xl border bg-background px-4 text-sidebar-foreground shadow-sm">
      <SidebarTrigger />

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/" />}>{t("appName")}</BreadcrumbLink>
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

      <div className="flex items-center gap-2">{end}</div>
    </header>
  )
}
