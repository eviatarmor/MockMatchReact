import { Minus, Plus, Undo2, Redo2 } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Separator } from "@mockmatch/ui/separator"
import { cn } from "@mockmatch/ui/utils"
import type { WhiteboardViewport } from "./viewport"

export type WhiteboardBottomBarLabels = {
  readonly undo: string
  readonly redo: string
  readonly zoomIn: string
  readonly zoomOut: string
  readonly resetZoom: string
}

export type WhiteboardBottomBarProps = {
  readonly viewport: WhiteboardViewport
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly onUndo: () => void
  readonly onRedo: () => void
  readonly labels: WhiteboardBottomBarLabels
  readonly className?: string
}

/**
 * Floating bottom bar over the canvas — same pattern as resume EditorBottomBar:
 * undo / redo · zoom − / % / +.
 */
export function WhiteboardBottomBar({
  viewport,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  labels,
  className,
}: WhiteboardBottomBarProps) {
  const {
    zoomPercent,
    zoomIn,
    zoomOut,
    resetView,
    canZoomIn,
    canZoomOut,
  } = viewport

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-background/90 px-1.5 py-1 shadow-sm backdrop-blur",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 cursor-pointer text-muted-foreground"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label={labels.undo}
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 cursor-pointer text-muted-foreground"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label={labels.redo}
      >
        <Redo2 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5 w-px self-center" />

      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 cursor-pointer"
          onClick={zoomOut}
          disabled={!canZoomOut}
          aria-label={labels.zoomOut}
        >
          <Minus className="size-3.5" />
        </Button>
        <button
          type="button"
          onClick={resetView}
          className="w-12 cursor-pointer text-center text-xs font-medium tabular-nums text-foreground hover:text-primary"
          aria-label={labels.resetZoom}
        >
          {zoomPercent}%
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 cursor-pointer"
          onClick={zoomIn}
          disabled={!canZoomIn}
          aria-label={labels.zoomIn}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
