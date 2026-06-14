import { CheckCircle2 } from "lucide-react"
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
    <Sidebar variant="floating" collapsible="icon" className="[&_[data-slot=sidebar-inner]]:rounded-xl [&_[data-slot=sidebar-inner]]:p-4 group-data-[collapsible=icon]:[&_[data-slot=sidebar-inner]]:p-2">
      <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
        <SidebarHeader className="p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <a href="/" className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CheckCircle2 className="size-5" />
                </span>
                <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">{t("appName")}</span>
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
              <NavMain items={NAV_DATA} />
            </div>
          </ScrollArea>
        </SidebarContent>

        <NavUser />
      </div>
    </Sidebar>
  )
}
