import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { NavbarSlotsProvider } from "@/components/dashboard/navbar-slots-context"
import { DetailPanel, DetailPanelProvider } from "@/components/dashboard/detail-panel"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DashboardLayout() {
  return (
    <ScrollArea className="h-svh w-full">
    <TooltipProvider>
      <SidebarProvider>
        <DetailPanelProvider>
          <AppSidebar />
          <SidebarInset className="m-4 md:ml-0 min-w-0 gap-4 bg-transparent shadow-none transition-[margin] duration-200 ease-linear">
            <NavbarSlotsProvider>
              <DashboardNavbar />
              <div className="flex min-w-0 flex-1 flex-col min-h-0 rounded-xl border bg-background p-4 shadow-sm">
                <Outlet />
              </div>
            </NavbarSlotsProvider>
          </SidebarInset>
          <DetailPanel />
        </DetailPanelProvider>
      </SidebarProvider>
    </TooltipProvider>
    </ScrollArea>
  )
}
