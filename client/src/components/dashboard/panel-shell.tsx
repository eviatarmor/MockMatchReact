import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PanelShellProps {
  readonly header: ReactNode
  readonly footer: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

export function PanelShell({ header, footer, children, className }: PanelShellProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="sticky top-0 z-0 flex items-center gap-3 border-b bg-background p-4">{header}</div>
      <div className="flex flex-col gap-4 p-4">{children}</div>
      <div className="sticky bottom-0 flex gap-2 border-t bg-background p-4">{footer}</div>
    </div>
  )
}
