import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Shared surface for secondary chrome under the main dashboard navbar.
 * Matches the content card (`main` in DashboardLayout): neutral-50 / neutral-950 —
 * never pure `bg-background` (white), which flashes on the gray shell.
 */
export const SECONDARY_BAR_SURFACE =
  "border-b border-border/60 bg-neutral-50 dark:bg-neutral-950"

/** Over-content glass: translucent + blur so the canvas / board peeks through. */
export const SECONDARY_BAR_SURFACE_STUCK =
  "border-b border-border/60 bg-neutral-50/75 backdrop-blur-md dark:bg-neutral-950/75"

interface EditorSecondaryBarProps {
  readonly left?: ReactNode
  readonly right?: ReactNode
  readonly className?: string
}

/**
 * Thin editor chrome under the main dashboard navbar.
 * Glass surface so the canvas shows through when the bar overlays it.
 * Holds doc name / presence / save on the left; Share · Preview · Export on the right.
 */
export function EditorSecondaryBar({
  left,
  right,
  className,
}: EditorSecondaryBarProps) {
  return (
    <div
      className={cn(
        "flex h-11 shrink-0 items-center justify-between gap-3 px-3 sm:px-4",
        SECONDARY_BAR_SURFACE_STUCK,
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      <div className="flex shrink-0 items-center gap-1.5">{right}</div>
    </div>
  )
}
