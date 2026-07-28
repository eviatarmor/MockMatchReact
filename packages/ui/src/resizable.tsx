import * as ResizablePrimitive from "react-resizable-panels"
import { GripVertical } from "lucide-react"

import { cn } from "./lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        // No bg-border — avoids a double/thick edge next to panel borders.
        "group/resizable-handle relative flex w-3 items-center justify-center bg-transparent",
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden",
        "aria-[orientation=horizontal]:h-3 aria-[orientation=horizontal]:w-full",
        "[&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border",
            // Standard shadcn grip — only visible on hover/focus of the handle
            "opacity-0 transition-opacity",
            "group-hover/resizable-handle:opacity-100 group-focus-visible/resizable-handle:opacity-100",
            "group-active/resizable-handle:opacity-100"
          )}
        >
          <GripVertical className="size-2.5 text-muted-foreground" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
