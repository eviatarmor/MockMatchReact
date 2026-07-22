import { useTranslation } from "react-i18next"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TemplatesPanel } from "../right-rail/templates-panel"
import { StylePanel } from "../right-rail/style-panel"
import { GeneralAnalysisPanel } from "../right-rail/general-analysis-panel"
import { AiPanel } from "../right-rail/ai-panel"
import type { DocumentStyle } from "@/components/document-editor"
import type { EditorTemplateId, ResumeDocument } from "../types"

export type CustomizePanel = "templates" | "style" | "analysis" | "ai"

interface MobileCustomizeSheetProps {
  readonly panel: CustomizePanel | null
  readonly onClose: () => void
  readonly activeTemplateId: EditorTemplateId
  readonly onTemplateChange: (id: EditorTemplateId) => void
  readonly style: DocumentStyle
  readonly onStyleChange: (patch: Partial<DocumentStyle>) => void
  readonly document: ResumeDocument
}

/** Mobile customise sheet: shows a single panel (templates / style / analysis / ai). */
export function MobileCustomizeSheet({
  panel,
  onClose,
  activeTemplateId,
  onTemplateChange,
  style,
  onStyleChange,
  document,
}: MobileCustomizeSheetProps) {
  const { t } = useTranslation("resume-editor")

  return (
    <Sheet open={panel !== null} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="bottom" className="grid max-h-[85svh] grid-rows-[auto_minmax(0,1fr)] gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>{panel ? t(`rail.${panel}`) : ""}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0">
          <div className="p-4">
            {panel === "templates" && <TemplatesPanel activeTemplateId={activeTemplateId} onSelect={onTemplateChange} />}
            {panel === "style" && <StylePanel style={style} onChange={onStyleChange} />}
            {panel === "analysis" && <GeneralAnalysisPanel document={document} />}
            {panel === "ai" && <AiPanel />}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
