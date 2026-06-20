import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Cloud } from "lucide-react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"
import { BreadcrumbName } from "./top-bar/breadcrumb-name"
import { EditorToolbarCenter, EditorToolbarActions } from "./top-bar/editor-toolbar"
import { EditorCanvas } from "./canvas/editor-canvas"
import { EditorRail } from "./right-rail/editor-rail"
import { useCanvasViewport } from "./hooks/use-canvas-viewport"
import { EDITOR_TEMPLATES, SAMPLE_DOCUMENT } from "./constants"
import type { EditorTemplateId } from "./types"

export function CoverLetterEditorPageContent() {
  const { t } = useTranslation("cover-letter-editor")
  const viewport = useCanvasViewport()
  const [templateId, setTemplateId] = useState<EditorTemplateId>("modern")
  const [letterName, setLetterName] = useState(SAMPLE_DOCUMENT.sender.title)

  const template = EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]
  const subtitle = t("toolbar.subtitle", { company: SAMPLE_DOCUMENT.recipient.company })

  const { zoomPercent, canZoomIn, canZoomOut, zoomIn, zoomOut, resetView } = viewport
  const crumb = useMemo(
    () => <BreadcrumbName value={letterName} onChange={setLetterName} />,
    [letterName]
  )
  const center = useMemo(
    () => <EditorToolbarCenter viewport={viewport} />,
    // Rebuild only when zoom state changes (viewport object identity is unstable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zoomPercent, canZoomIn, canZoomOut, zoomIn, zoomOut, resetView]
  )
  const end = useMemo(() => <EditorToolbarActions />, [])
  useNavbarSlots({ crumb, center, end })

  return (
    <div className="relative h-full min-h-0">
      <EditorCanvas document={SAMPLE_DOCUMENT} template={template} viewport={viewport} />

      <div className="pointer-events-none absolute left-1 top-1 z-10 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{letterName}</span>
          <span className="flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur">
            <Cloud className="size-3" />
            {t("toolbar.saved")}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>

      <EditorRail activeTemplateId={templateId} onTemplateChange={setTemplateId} />
    </div>
  )
}
