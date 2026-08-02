import type { ReactNode } from "react"
import {
  EDITOR_SECONDARY_BAR_ROW,
  EDITOR_SECONDARY_BAR_SURFACE,
  EDITOR_SECONDARY_BAR_SURFACE_STUCK,
} from "@mockmatch/ui/lib/editor-chrome"
import { cn } from "@mockmatch/ui/utils"

/** @deprecated Prefer `EDITOR_SECONDARY_BAR_SURFACE` from `@mockmatch/ui/lib/editor-chrome`. */
export const SECONDARY_BAR_SURFACE = EDITOR_SECONDARY_BAR_SURFACE

/** @deprecated Prefer `EDITOR_SECONDARY_BAR_SURFACE_STUCK` from `@mockmatch/ui/lib/editor-chrome`. */
export const SECONDARY_BAR_SURFACE_STUCK = EDITOR_SECONDARY_BAR_SURFACE_STUCK

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
        EDITOR_SECONDARY_BAR_ROW,
        "justify-between gap-3",
        EDITOR_SECONDARY_BAR_SURFACE_STUCK,
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      <div className="flex shrink-0 items-center gap-1.5">{right}</div>
    </div>
  )
}
