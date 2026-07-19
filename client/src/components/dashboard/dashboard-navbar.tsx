import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useNavbarSlotsValue } from "@/hooks/use-navbar-slots"
import { NAV_DATA } from "@/components/dashboard/constants"

interface DashboardNavbarProps {
  readonly rounded?: boolean
}

export function DashboardNavbar({ rounded = false }: DashboardNavbarProps) {
  const { t } = useTranslation("common")
  const { pathname } = useLocation()
  const { crumb, center, end } = useNavbarSlotsValue()

  const currentItem = NAV_DATA.find((item) => item.href && pathname.startsWith(item.href))

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-6 text-foreground",
        rounded && "rounded-t-xl"
      )}
    >
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
