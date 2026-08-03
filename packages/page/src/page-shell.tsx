import type { ReactNode } from "react"
import { cn } from "@mockmatch/ui/utils"
import type { PageShellLabels } from "./types"

export type PageShellProps = {
  /** Top chrome (IdeChromeBar, menubar, …). */
  readonly chrome?: ReactNode
  /** Optional right rail (AI, outline, …). */
  readonly rightRail?: ReactNode
  readonly children: ReactNode
  readonly labels?: PageShellLabels
  readonly className?: string
}

/**
 * Layout for freeform document practice: chrome + scrollable canvas column + optional rail.
 */
export function PageShell({
  chrome,
  rightRail,
  children,
  labels,
  className,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden bg-background",
        className
      )}
    >
      {chrome ? <div className="z-20 shrink-0">{chrome}</div> : null}
      <div className="flex min-h-0 flex-1">
        <div
          className="min-h-0 min-w-0 flex-1"
          role="main"
          aria-label={labels?.canvasAria}
        >
          {children}
        </div>
        {rightRail ? (
          <aside className="z-10 flex w-72 shrink-0 flex-col overflow-hidden border-l border-border bg-background">
            {rightRail}
          </aside>
        ) : null}
      </div>
    </div>
  )
}
