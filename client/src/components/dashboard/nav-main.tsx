import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavItem {
  readonly label?: string
  readonly isSection?: boolean
  readonly title?: string
  readonly icon?: LucideIcon
  readonly href?: string
}

export function NavMain({ items }: { readonly items: NavItem[] }) {
  const { t } = useTranslation("common")
  const { pathname } = useLocation()

  return (
    <>
      {items.map((item) => {
        if (item.isSection && item.label) {
          return (
            <SidebarGroup key={item.label} className="p-0 pt-5 first:pt-0">
              <SidebarGroupLabel className="p-0 text-xs font-medium uppercase text-sidebar-foreground">
                {t(item.label)}
              </SidebarGroupLabel>
            </SidebarGroup>
          )
        }

        if (item.title && item.href) {
          const isActive = pathname.startsWith(item.href)

          return (
            <SidebarGroup key={item.title} className="p-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={t(item.title)}
                    isActive={isActive}
                    className={cn(
                      "rounded-md text-sm font-medium px-3 py-2 h-9 transition-colors cursor-pointer",
                      isActive ? "bg-primary! text-primary-foreground!" : ""
                    )}
                    render={<Link to={item.href} />}
                  >
                    {item.icon && <item.icon />}
                    {t(item.title)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )
        }

        return null
      })}
    </>
  )
}
