import { useTranslation } from "react-i18next"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TemplatesPanel } from "../right-rail/templates-panel"
import { StylePanel } from "../right-rail/style-panel"
import { AiPanel } from "../right-rail/ai-panel"
import type { EditorTemplateId } from "../types"

export type CustomizePanel = "templates" | "style" | "ai"

interface MobileCustomizeSheetProps {
  readonly panel: CustomizePanel | null
  readonly onClose: () => void
  readonly activeTemplateId: EditorTemplateId
  readonly onTemplateChange: (id: EditorTemplateId) => void
}

/** Mobile customise sheet: shows a single panel (templates / style / ai). */
export function MobileCustomizeSheet({ panel, onClose, activeTemplateId, onTemplateChange }: MobileCustomizeSheetProps) {
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
            {panel === "style" && <StylePanel />}
            {panel === "ai" && <AiPanel />}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
