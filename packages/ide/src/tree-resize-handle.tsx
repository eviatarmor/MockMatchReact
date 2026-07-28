import type { PointerEventHandler } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@mockmatch/ui/utils"

type TreeResizeHandleProps = {
  readonly onPointerDown: PointerEventHandler<HTMLElement>
  readonly label?: string
  readonly className?: string
}

/** Right-edge drag handle for left tree panel — matches shadcn resizable grip. */
export function TreeResizeHandle({
  onPointerDown,
  label = "Resize panel",
  className,
}: TreeResizeHandleProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      className={cn(
        "group/resizable-handle absolute inset-y-0 right-0 z-20 flex w-3 translate-x-1/2 cursor-col-resize items-center justify-center",
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
