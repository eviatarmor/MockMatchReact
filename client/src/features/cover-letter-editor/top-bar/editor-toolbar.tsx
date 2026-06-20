import { useTranslation } from "react-i18next"
import { Minus, Plus, Undo2, Redo2, Maximize, Share2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { useCanvasViewport } from "../hooks/use-canvas-viewport"

interface EditorToolbarCenterProps {
  readonly viewport: ReturnType<typeof useCanvasViewport>
}

/** Center navbar slot: undo/redo + zoom controls. */
export function EditorToolbarCenter({ viewport }: EditorToolbarCenterProps) {
  const { t } = useTranslation("cover-letter-editor")
  const { zoomPercent, zoomIn, zoomOut, resetView, canZoomIn, canZoomOut } = viewport

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={t("toolbar.undo")}>
        <Undo2 className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={t("toolbar.redo")}>
        <Redo2 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-6 cursor-pointer"
          onClick={zoomOut}
          disabled={!canZoomOut}
          aria-label={t("toolbar.zoomOut")}
        >
          <Minus className="size-3.5" />
        </Button>
        <button
          type="button"
          onClick={resetView}
          className="w-12 cursor-pointer text-center text-xs font-medium tabular-nums text-foreground hover:text-primary"
          aria-label={t("toolbar.resetZoom")}
        >
          {zoomPercent}%
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 cursor-pointer"
          onClick={zoomIn}
          disabled={!canZoomIn}
          aria-label={t("toolbar.zoomIn")}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-7 cursor-pointer text-muted-foreground"
        onClick={resetView}
        aria-label={t("toolbar.resetView")}
      >
        <Maximize className="size-4" />
      </Button>
    </div>
  )
}

/** End navbar slot: share + export. */
export function EditorToolbarActions() {
  const { t } = useTranslation("cover-letter-editor")

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-muted-foreground" aria-label={t("toolbar.share")}>
        <Share2 className="size-4" />
      </Button>
      <Button size="sm" className="h-8 cursor-pointer gap-1.5">
        <Download className="size-4" />
        <span className="hidden sm:inline">{t("toolbar.exportPdf")}</span>
      </Button>
    </div>
  )
}
