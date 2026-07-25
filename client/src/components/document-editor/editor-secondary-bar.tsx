import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EditorSecondaryBarProps {
  readonly left?: ReactNode
  readonly right?: ReactNode
  readonly className?: string
}

/**
 * Thin editor chrome under the main dashboard navbar.
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
        "flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background px-3 sm:px-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      <div className="flex shrink-0 items-center gap-1.5">{right}</div>
    </div>
  )
}
