import type { ReactNode } from "react"
import { cn } from "@mockmatch/ui/utils"

export type WhiteboardShellProps = {
  readonly toolRail?: ReactNode
  readonly topBar?: ReactNode
  readonly rightRail?: ReactNode
  /** Floating bottom chrome (undo/zoom) — overlaid on canvas. */
  readonly bottomBar?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

/**
 * Layout chrome for the whiteboard surface.
 * Host fills tool rail, top bar, right rail, bottom bar; children = canvas.
 */
export function WhiteboardShell({
  toolRail,
  topBar,
  rightRail,
  bottomBar,
  children,
  className,
}: WhiteboardShellProps) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background",
        className
      )}
    >
      {/* Host supplies glass chrome (IdeChromeBar / EditorSecondaryBar). */}
      {topBar ? <div className="z-20 shrink-0">{topBar}</div> : null}
      <div className="relative flex min-h-0 flex-1">
        {/* Canvas column */}
        <div className="relative min-h-0 min-w-0 flex-1">
          {toolRail ? (
            <div className="pointer-events-none absolute left-3 top-3 z-20">
              <div className="pointer-events-auto">{toolRail}</div>
            </div>
          ) : null}
          <div className="absolute inset-0 min-h-0">{children}</div>
          {bottomBar ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
              <div className="pointer-events-none relative h-0">
                {bottomBar}
              </div>
            </div>
          ) : null}
        </div>
        {/* Always-on right sidebar (prompt / templates) */}
        {rightRail ? (
          <aside className="z-10 flex w-72 shrink-0 flex-col overflow-hidden border-l border-border bg-background">
            {rightRail}
          </aside>
        ) : null}
      </div>
    </div>
  )
}
