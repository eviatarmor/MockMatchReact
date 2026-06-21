import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Cloud } from "lucide-react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"
import { BreadcrumbName } from "./top-bar/breadcrumb-name"
import { EditorBottomBar, EditorToolbarActions } from "./top-bar/editor-toolbar"
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
  const end = useMemo(() => <EditorToolbarActions />, [])
  useNavbarSlots({ crumb, center: null, end })

  return (
    <div className="relative h-full min-h-0">
      <EditorCanvas document={SAMPLE_DOCUMENT} template={template} viewport={viewport} />

      <EditorBottomBar viewport={viewport} />

      <EditorRail activeTemplateId={templateId} onTemplateChange={setTemplateId} />
    </div>
  )
}
