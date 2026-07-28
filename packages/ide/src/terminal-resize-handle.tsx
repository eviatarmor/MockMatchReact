import type { PointerEventHandler } from "react"
import { GripHorizontal } from "lucide-react"
import { cn } from "@mockmatch/ui/utils"

type TerminalResizeHandleProps = {
  readonly onPointerDown: PointerEventHandler<HTMLElement>
  readonly label?: string
  readonly className?: string
}

/** Top-edge drag handle for bottom terminal panel. */
export function TerminalResizeHandle({
  onPointerDown,
  label = "Resize terminal",
  className,
}: TerminalResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      className={cn(
        "group/term-resize absolute inset-x-0 top-0 z-20 flex h-3 -translate-y-1/2 cursor-row-resize items-center justify-center",
        "touch-none select-none bg-transparent",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
    >
      <div
        className={cn(
          "z-10 flex h-3 w-4 items-center justify-center rounded-sm border bg-border",
          "opacity-0 transition-opacity",
          "group-hover/term-resize:opacity-100 group-focus-visible/term-resize:opacity-100",
          "group-active/term-resize:opacity-100"
        )}
      >
        <GripHorizontal className="size-2.5 text-muted-foreground" />
      </div>
    </div>
  )
}
