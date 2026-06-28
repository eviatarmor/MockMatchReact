import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Cloud } from "lucide-react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"
import { useIsMobile } from "@/hooks/use-mobile"
import { BreadcrumbName } from "./top-bar/breadcrumb-name"
import { EditorBottomBar, EditorToolbarActions } from "./top-bar/editor-toolbar"
import { EditorCanvas } from "./canvas/editor-canvas"
import { EditorRail } from "./right-rail/editor-rail"
import { MobileEditor } from "./mobile/mobile-editor"
import { useCanvasViewport } from "./hooks/use-canvas-viewport"
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

  const template = EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]

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
        template={template}
        templateId={templateId}
        onTemplateChange={setTemplateId}
        handlers={handlers}
      />
    )
  }

  return (
    <div className="relative h-full min-h-0">
      <EditorCanvas document={document} template={template} viewport={viewport} handlers={handlers} />

      <EditorBottomBar viewport={viewport} />

      <EditorRail activeTemplateId={templateId} onTemplateChange={setTemplateId} document={document} handlers={handlers} />
    </div>
  )
}
