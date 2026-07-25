import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PanelShellProps {
  readonly header: ReactNode
  /** Always pinned to the bottom of the panel (outside scroll). */
  readonly footer?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

/**
 * Detail-sheet layout: fixed header, scrollable body, fixed footer.
 * Parent must fill height (e.g. SheetContent `h-full` flex column).
 */
export function PanelShell({ header, footer, children, className }: PanelShellProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="shrink-0 border-b bg-background p-4 pr-12">{header}</div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4">{children}</div>
      </div>
      {footer != null && (
        <div className="shrink-0 border-t bg-background p-4">{footer}</div>
      )}
    </div>
  )
}
