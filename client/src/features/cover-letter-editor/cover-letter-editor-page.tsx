import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Cloud } from "lucide-react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"
import { useIsMobile } from "@/hooks/use-mobile"
import { resolveStyleClasses, type DocumentStyle } from "@/components/document-editor"
import { BreadcrumbName } from "./top-bar/breadcrumb-name"
import { EditorBottomBar, EditorToolbarActions } from "./top-bar/editor-toolbar"
import { EditorCanvas } from "./canvas/editor-canvas"
import { EditorRail } from "./right-rail/editor-rail"
import { MobileEditor } from "./mobile/mobile-editor"
import { useCanvasViewport } from "@/hooks/use-canvas-viewport"
import { useCoverLetterDocument } from "./hooks/use-cover-letter-document"
import { EDITOR_TEMPLATES, SAMPLE_DOCUMENT } from "./constants"
import type { EditorTemplateId } from "./types"

export function CoverLetterEditorPageContent() {
  const { t } = useTranslation("cover-letter-editor")
  const isMobile = useIsMobile()
  const viewport = useCanvasViewport()
  const { document, handlers } = useCoverLetterDocument(SAMPLE_DOCUMENT)
  const [templateId, setTemplateId] = useState<EditorTemplateId>("modern")
  const [letterName, setLetterName] = useState(SAMPLE_DOCUMENT.sender.title)
  const [style, setStyle] = useState<DocumentStyle>(EDITOR_TEMPLATES[0].defaultStyle)

  const template = EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]
  const resolvedStyle = useMemo(() => resolveStyleClasses(style), [style])

  // Selecting a template reseeds the style axes to that template's defaults; the
  // Style panel then overrides any axis on top.
  const selectTemplate = (id: EditorTemplateId) => {
    setTemplateId(id)
    const next = EDITOR_TEMPLATES.find((item) => item.id === id)
    if (next) setStyle(next.defaultStyle)
  }
  const updateStyle = (patch: Partial<DocumentStyle>) => setStyle((prev) => ({ ...prev, ...patch }))

  const crumb = useMemo(
    () => (
      <span className="flex items-center gap-2">
        <BreadcrumbName value={letterName} onChange={setLetterName} />
        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          <Cloud className="size-3" />
          {t("toolbar.saved")}
        </span>
      </span>
    ),
    [letterName, t]
  )
  // The breadcrumb (and its inline editable name) is hidden below md, so on
  // mobile surface the editable title via the always-visible center slot.
  const center = useMemo(
    () => (isMobile ? <BreadcrumbName value={letterName} onChange={setLetterName} /> : null),
    [isMobile, letterName]
  )
  const end = useMemo(() => <EditorToolbarActions />, [])
  useNavbarSlots({ crumb, center, end })

  if (isMobile) {
    return (
      <MobileEditor
        document={document}
        style={resolvedStyle}
        documentStyle={style}
        onStyleChange={updateStyle}
        templateId={templateId}
        onTemplateChange={selectTemplate}
        handlers={handlers}
      />
    )
  }

  return (
    <div className="relative h-full min-h-0">
      <EditorCanvas document={document} template={template} style={resolvedStyle} viewport={viewport} handlers={handlers} />

      <EditorBottomBar viewport={viewport} />

      <EditorRail
        activeTemplateId={templateId}
        onTemplateChange={selectTemplate}
        style={style}
        onStyleChange={updateStyle}
        document={document}
        handlers={handlers}
      />
    </div>
  )
}
