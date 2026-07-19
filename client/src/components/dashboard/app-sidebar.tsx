import { AppLogo } from "@/components/icons/app-logo"
import { useTranslation } from "react-i18next"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavMain } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import { NAV_DATA } from "@/components/dashboard/constants"

export function AppSidebar() {
  const { t } = useTranslation("common")

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden p-4 group-data-[collapsible=icon]:p-2">
        <SidebarHeader className="p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <a href="/" className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                <AppLogo className="size-8 shrink-0" />
                <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">{t("appName")}</span>
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="pr-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:pr-0">
              <NavMain items={NAV_DATA} />
            </div>
          </ScrollArea>
        </SidebarContent>

        <NavUser />
      </div>
    </Sidebar>
  )
}
