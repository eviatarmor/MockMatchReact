import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Minus,
  Plus,
  Undo2,
  Redo2,
  Share2,
  Download,
  Loader2,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@mockmatch/ui/button"
import { Separator } from "@mockmatch/ui/separator"
import { DocumentPreviewDialog } from "@/components/data/document-preview-dialog"
import { downloadDocumentPdf, pdfFilename } from "@/lib/export-document-pdf"
import type { useCanvasViewport } from "@/hooks/use-canvas-viewport"
import type { DocumentHistoryControls } from "@/hooks/use-document-history"
import { ShareDialog } from "@/features/collab/components/share-dialog"
import { trpc } from "@/lib/trpc"

interface EditorBottomBarProps {
  readonly viewport: ReturnType<typeof useCanvasViewport>
  readonly history: DocumentHistoryControls
}

/** Floating bottom bar over the canvas: undo/redo + zoom controls. */
export function EditorBottomBar({ viewport, history }: EditorBottomBarProps) {
  const { t } = useTranslation("resume-editor")
  const { zoomPercent, zoomIn, zoomOut, resetView, canZoomIn, canZoomOut } =
    viewport

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-background/90 px-1.5 py-1 shadow-sm backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 cursor-pointer text-muted-foreground"
        onClick={history.undo}
        disabled={!history.canUndo}
        aria-label={t("toolbar.undo")}
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 cursor-pointer text-muted-foreground"
        onClick={history.redo}
        disabled={!history.canRedo}
        aria-label={t("toolbar.redo")}
      >
        <Redo2 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5 w-px self-center" />

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
  readonly resumeId: string
  readonly title: string
  readonly permissions?: {
    canShare: boolean
    canExport: boolean
  }
  /** Live read-only document for the preview dialog. */
  readonly preview?: ReactNode
}

/** Secondary-bar actions: Preview · Share · Export. */
export function EditorToolbarActions({
  resumeId,
  title,
  permissions,
  preview,
}: EditorToolbarActionsProps) {
  const { t } = useTranslation("resume-editor")
  const [exporting, setExporting] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const access = trpc.collab.getAccess.useQuery(
    { kind: "resume", id: resumeId },
    { staleTime: 30_000 }
  )

  const canShare = permissions?.canShare ?? access.data?.canShare ?? false
  const canExport = permissions?.canExport ?? true
  const isOwner = access.data?.role === "owner"
  const isPaidOwner = access.data?.isPaidOwner ?? access.data?.isOwnerPaid ?? false

  const onExport = async () => {
    if (exporting || !canExport) return
    setExporting(true)
    try {
      await downloadDocumentPdf({
        kind: "resume",
        id: resumeId,
        filename: pdfFilename(title, "resume"),
      })
      toast.success(t("toolbar.exportSuccess"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toolbar.exportError")
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {preview != null && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 cursor-pointer gap-1.5 text-muted-foreground"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="size-4" />
          <span className="hidden sm:inline">{t("toolbar.preview")}</span>
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        className="h-8 cursor-pointer gap-1.5"
        onClick={() => setShareOpen(true)}
      >
        <Share2 className="size-3.5" />
        {t("toolbar.share")}
      </Button>
      {canExport && (
        <Button
          size="sm"
          className="h-8 cursor-pointer gap-1.5"
          onClick={() => void onExport()}
          disabled={exporting}
          aria-busy={exporting}
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <span className="hidden sm:inline">{t("toolbar.exportPdf")}</span>
        </Button>
      )}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        kind="resume"
        documentId={resumeId}
        documentTitle={title}
        canShare={canShare}
        isOwner={isOwner}
        isPaidOwner={isPaidOwner}
      />
      {preview != null && (
        <DocumentPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          title={title}
          description={t("toolbar.previewDescription")}
        >
          {preview}
        </DocumentPreviewDialog>
      )}
    </div>
  )
}
