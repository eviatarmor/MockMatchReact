import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { NavbarSlotsProvider } from "@/components/dashboard/navbar-slots-context"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function DashboardLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="m-4 ml-0 gap-4 bg-transparent shadow-none transition-[margin] duration-200 ease-linear">
          <NavbarSlotsProvider>
            <DashboardNavbar />
            <div className="flex flex-1 flex-col rounded-xl border bg-sidebar p-4 shadow-sm">
              <Outlet />
            </div>
          </NavbarSlotsProvider>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
