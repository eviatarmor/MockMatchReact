import type { PointerEventHandler } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

type SidePanelResizeHandleProps = {
  readonly onPointerDown: PointerEventHandler<HTMLElement>
  readonly label?: string
  readonly className?: string
}

/**
 * Left-edge drag handle — shadcn ResizableHandle look, grip only on hover.
 * Used when the panel itself is animated with motion (not a Panel Group).
 */
export function SidePanelResizeHandle({
  onPointerDown,
  label = "Resize panel",
  className,
}: SidePanelResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      className={cn(
        // Transparent hit target — panel `border-l` is the only edge line (no double border).
        "group/resizable-handle absolute inset-y-0 left-0 z-20 flex w-3 -translate-x-1/2 cursor-col-resize items-center justify-center",
        "touch-none select-none bg-transparent",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
    >
      <div
        className={cn(
          "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border",
          "opacity-0 transition-opacity",
          "group-hover/resizable-handle:opacity-100 group-focus-visible/resizable-handle:opacity-100",
          "group-active/resizable-handle:opacity-100"
        )}
      >
        <GripVertical className="size-2.5 text-muted-foreground" />
      </div>
    </div>
  )
}
