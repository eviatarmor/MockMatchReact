import type { ReactNode } from "react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"

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
  // Page-specific end actions only — help / notifications / feedback live in DashboardNavbar.
  useNavbarSlots({
    end: actions ? (
      <div className="flex items-center gap-1.5 sm:gap-2">{actions}</div>
    ) : null,
  })

  // No own overflow scroller: DashboardLayout already scrolls the outlet.
  // A second (unbounded) scroller here breaks position:sticky and scroll-spy.
  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      {children ?? (
        <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-xl border border-dashed border-muted/50 p-6">
          <h1 className="text-xl font-medium text-muted-foreground">{title}</h1>
        </div>
      )}
    </div>
  )
}
