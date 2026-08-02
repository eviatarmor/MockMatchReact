import { Outlet, useLocation, matchPath } from "react-router-dom"
import { IconRail } from "@/components/dashboard/icon-rail"
import { SectionNav } from "@/components/dashboard/section-nav"
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { NavbarSlotsProvider } from "@/components/dashboard/navbar-slots-context"
import { DetailPanel, DetailPanelProvider } from "@/components/dashboard/detail-panel"
import { useActiveSection } from "@/components/dashboard/use-active-section"
import { useNavCollapsed } from "@/components/dashboard/use-nav-collapsed"
import { TooltipProvider } from "@mockmatch/ui/tooltip"
import { ScrollArea } from "@mockmatch/ui/scroll-area"
import { AskProvider } from "@/features/ask/ask-provider"
import { AskPanel } from "@/features/ask/components/ask-panel"
import { useAskPanel } from "@/features/ask/ask-context"
import { cn } from "@/lib/utils"

function DashboardShell() {
  const { pathname } = useLocation()
  const section = useActiveSection()
  const { collapsed, toggle, expand } = useNavCollapsed()
  const { open: askOpen } = useAskPanel()
  // Editor routes keep the same sidebar (icon rail + section-nav collapse).
  // Only the content card differs: canvas fills edge-to-edge (no scroll/padding).
  const isEditor = Boolean(
    (matchPath("/cover-letters/:letterId", pathname) &&
      !matchPath("/cover-letters/templates", pathname)) ||
      matchPath("/resumes/:resumeId", pathname) ||
      matchPath("/simulations/code-run/:format", pathname) ||
      matchPath("/simulations/practice/:questionId", pathname) ||
      matchPath("/simulations/mcq/:questionId", pathname) ||
      matchPath("/simulations/workspace", pathname) ||
      matchPath("/simulations/terminal-lab", pathname) ||
      matchPath("/simulations/conversation/:trackId", pathname)
  )

  return (
    <>
      {/* Dark shell spans the full viewport; chrome sits flush to the edges. */}
      <div className="relative z-10 flex h-svh w-full overflow-hidden bg-sidebar">
        <IconRail
          activeSectionId={section.id}
          onNavigate={expand}
          collapsed={collapsed}
          onExpand={expand}
        />
        <SectionNav
          section={section}
          collapsed={collapsed}
          onToggle={toggle}
        />

        {/* Content card: gap when Ask closed; flush to panel when open (push layout). */}
        <main
          className={cn(
            "my-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-neutral-50 shadow-sm dark:bg-neutral-950",
            // Align margin change with Ask CSS width (~360ms) so the card doesn't snap.
            "transition-[margin] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            askOpen ? "mr-0" : "mr-2"
          )}
        >
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

        <AskPanel />
      </div>
      <DetailPanel />
    </>
  )
}

export function DashboardLayout() {
  return (
    <TooltipProvider>
      <AskProvider>
        <DetailPanelProvider>
          <NavbarSlotsProvider>
            <DashboardShell />
          </NavbarSlotsProvider>
        </DetailPanelProvider>
      </AskProvider>
    </TooltipProvider>
  )
}
