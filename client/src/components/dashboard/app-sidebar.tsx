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
import { NAV_DATA } from "@/components/dashboard/constants"

export function AppSidebar() {
  const { t } = useTranslation("common")

  return (
    <Sidebar variant="floating" className="p-4 h-full [&_[data-slot=sidebar-inner]]:h-full">
      <div className="flex flex-col gap-6 overflow-hidden">
        <SidebarHeader className="px-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <a href="/" className="flex w-full items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CheckCircle2 className="size-5" />
                </span>
                <span className="text-lg font-semibold">{t("appName")}</span>
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="overflow-hidden">
          <ScrollArea className="h-[calc(100vh-100px)]">
            <div className="px-4">
              <NavMain items={NAV_DATA} />
            </div>
          </ScrollArea>
        </SidebarContent>
      </div>
    </Sidebar>
  )
}
