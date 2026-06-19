import type { ReactNode } from "react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationBell } from "./notification-bell"
import { FeedbackButton } from "./feedback-button"
import { NavbarHelpButton } from "./navbar-help-button"

interface DashboardPageShellProps {
  readonly title: string
  readonly actions?: ReactNode
  readonly children?: ReactNode
}

export function DashboardPageShell({
  title,
  actions,
  children,
}: DashboardPageShellProps) {
  useNavbarSlots({
    end: (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {actions}
<NavbarHelpButton />
        <NotificationBell />
        <FeedbackButton />
      </div>
    ),
  })

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      <ScrollArea className="flex-1 min-h-0">
        {children ?? (
          <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-xl border border-dashed border-muted/50 p-6">
            <h1 className="text-xl font-medium text-muted-foreground">{title}</h1>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
