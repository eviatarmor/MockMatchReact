import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Minus, Plus, Undo2, Redo2, Share2, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { downloadDocumentPdf, pdfFilename } from "@/lib/export-document-pdf"
import type { useCanvasViewport } from "@/hooks/use-canvas-viewport"

interface EditorBottomBarProps {
  readonly viewport: ReturnType<typeof useCanvasViewport>
}

/** Floating bottom bar over the canvas: undo/redo + zoom controls. */
export function EditorBottomBar({ viewport }: EditorBottomBarProps) {
  const { t } = useTranslation("cover-letter-editor")
  const { zoomPercent, zoomIn, zoomOut, resetView, canZoomIn, canZoomOut } = viewport

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-background/90 px-1.5 py-1 shadow-sm backdrop-blur">
      <Button variant="ghost" size="icon" className="size-7 cursor-pointer text-muted-foreground" aria-label={t("toolbar.undo")}>
        <Undo2 className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" className="size-7 cursor-pointer text-muted-foreground" aria-label={t("toolbar.redo")}>
        <Redo2 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <div className="flex items-center gap-0.5">
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
    </div>
  )
}

interface EditorToolbarActionsProps {
  readonly letterId: string
  readonly title: string
}

/** End navbar slot: share + export. */
export function EditorToolbarActions({ letterId, title }: EditorToolbarActionsProps) {
  const { t } = useTranslation("cover-letter-editor")
  const [exporting, setExporting] = useState(false)

  const onExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      await downloadDocumentPdf({
        kind: "cover-letter",
        id: letterId,
        filename: pdfFilename(title, "cover-letter"),
      })
      toast.success(t("toolbar.exportSuccess"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toolbar.exportError"))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="icon" className="size-8 cursor-pointer text-muted-foreground" aria-label={t("toolbar.share")}>
        <Share2 className="size-4" />
      </Button>
      <Button
        size="sm"
        className="h-8 cursor-pointer gap-1.5"
        onClick={() => void onExport()}
        disabled={exporting}
        aria-busy={exporting}
      >
        {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        <span className="hidden sm:inline">{t("toolbar.exportPdf")}</span>
      </Button>
    </div>
  )
}
