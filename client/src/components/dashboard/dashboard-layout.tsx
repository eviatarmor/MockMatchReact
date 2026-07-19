import { Outlet, useLocation, matchPath } from "react-router-dom"
import { IconRail } from "@/components/dashboard/icon-rail"
import { SectionNav } from "@/components/dashboard/section-nav"
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { NavbarSlotsProvider } from "@/components/dashboard/navbar-slots-context"
import { DetailPanel, DetailPanelProvider } from "@/components/dashboard/detail-panel"
import { useActiveSection } from "@/components/dashboard/use-active-section"
import { useNavCollapsed } from "@/components/dashboard/use-nav-collapsed"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DashboardLayout() {
  const { pathname } = useLocation()
  const section = useActiveSection()
  const { collapsed, toggle, expand } = useNavCollapsed()
  // Editor routes run a focused variant: icon rail only (no wide section-nav),
  // and the canvas fills the content card edge-to-edge (no scroll/padding).
  const isEditor = Boolean(
    (matchPath("/cover-letters/:letterId", pathname) &&
      !matchPath("/cover-letters/templates", pathname)) ||
      matchPath("/resumes/:resumeId", pathname)
  )

  return (
    <TooltipProvider>
      <DetailPanelProvider>
        <NavbarSlotsProvider>
          {/* Dark shell spans the full viewport; chrome sits flush to the edges. */}
          <div className="relative z-10 flex h-svh w-full overflow-hidden bg-sidebar">
            <IconRail activeSectionId={section.id} onNavigate={expand} />
            {!isEditor && <SectionNav section={section} collapsed={collapsed} onToggle={toggle} />}

            {/* Content area floats as an inset, rounded card on the dark shell. */}
            <main className="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-neutral-50 shadow-sm dark:bg-neutral-950">
              <DashboardNavbar rounded />
              {isEditor ? (
                // Editor canvas fills the card; it manages its own pan/zoom scroll.
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <Outlet />
                </div>
              ) : (
                <ScrollArea className="min-h-0 flex-1">
                  <div className="flex min-w-0 flex-col px-6 py-6">
                    <Outlet />
                  </div>
                </ScrollArea>
              )}
            </main>
          </div>
          <DetailPanel />
        </NavbarSlotsProvider>
      </DetailPanelProvider>
    </TooltipProvider>
  )
}
