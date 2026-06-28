import { useState } from "react"
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "motion/react"
import { PanelRightClose } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { EDITOR_RAIL_ITEMS } from "../constants"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { CoverLetterDocument, EditorPanelId, EditorTemplateId } from "../types"
import { TemplatesPanel } from "./templates-panel"
import { StylePanel } from "./style-panel"
import { SectionsPanel } from "./sections-panel"
import { AiPanel } from "./ai-panel"

interface EditorRailProps {
  readonly activeTemplateId: EditorTemplateId
  readonly onTemplateChange: (id: EditorTemplateId) => void
  readonly document: CoverLetterDocument
  readonly handlers: CoverLetterHandlers
}

function PanelBody({ panel, activeTemplateId, onTemplateChange, document, handlers }: {
  readonly panel: EditorPanelId
  readonly activeTemplateId: EditorTemplateId
  readonly onTemplateChange: (id: EditorTemplateId) => void
  readonly document: CoverLetterDocument
  readonly handlers: CoverLetterHandlers
}) {
  switch (panel) {
    case "templates":
      return <TemplatesPanel activeTemplateId={activeTemplateId} onSelect={onTemplateChange} />
    case "style":
      return <StylePanel />
    case "sections":
      return <SectionsPanel blocks={document.blocks} handlers={handlers} />
    case "ai":
      return <AiPanel />
  }
}

export function EditorRail({ activeTemplateId, onTemplateChange, document, handlers }: EditorRailProps) {
  const { t } = useTranslation("cover-letter-editor")
  const [activePanel, setActivePanel] = useState<EditorPanelId | null>("templates")

  const toggle = (id: EditorPanelId) => setActivePanel((current) => (current === id ? null : id))

  return (
    <TooltipProvider delay={300}>
      <div className="fixed right-4 bottom-4 top-[5.5rem] z-10 flex overflow-hidden rounded-xl border bg-background text-sidebar-foreground shadow-sm">

        <AnimatePresence initial={false}>
          {activePanel && (
            <motion.aside
              key="panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="overflow-hidden border-r border-border/60"
            >
              <div className="flex h-full min-h-0 w-80 flex-col">
                <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 pb-4 pt-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">{t(`${activePanel}.title`)}</h2>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t(`${activePanel}.description`)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 cursor-pointer text-muted-foreground"
                    onClick={() => setActivePanel(null)}
                    aria-label={t("rail.collapse")}
                  >
                    <PanelRightClose className="size-4" />
                  </Button>
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="px-4 py-4">
                    <PanelBody panel={activePanel} activeTemplateId={activeTemplateId} onTemplateChange={onTemplateChange} document={document} handlers={handlers} />
                  </div>
                </ScrollArea>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <nav className="flex w-12 shrink-0 flex-col items-center gap-1 py-3">
          {EDITOR_RAIL_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activePanel === item.id
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-pressed={isActive}
                      aria-label={t(item.labelKey)}
                      className={cn(
                        "flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-muted"
                      )}
                    />
                  }
                >
                  <Icon className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="left">{t(item.labelKey)}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </div>
    </TooltipProvider>
  )
}
