import { useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { PanelRightClose } from "lucide-react"
import { CollapsibleSidePanel } from "@mockmatch/ui/collapsible-side-panel"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@mockmatch/ui/tooltip"
import { ScrollArea } from "@mockmatch/ui/scroll-area"
import { Button } from "@mockmatch/ui/button"
import { SidePanelResizeHandle } from "@mockmatch/ui/side-panel-resize-handle"
import { useSidePanelWidth } from "@/hooks/use-side-panel-width"
import { useDocumentAssistantOptional } from "@/features/document-assistant"
import { EDITOR_RAIL_ITEMS } from "../constants"
import type { DocumentStyle } from "@/components/document-editor"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { CoverLetterDocument, EditorPanelId, EditorTemplateId } from "../types"
import { HistoryPanel } from "@/features/document-history/history-panel"
import { TemplatesPanel } from "./templates-panel"
import { StylePanel } from "./style-panel"
import { SectionsPanel } from "./sections-panel"
import { GeneralAnalysisPanel } from "./general-analysis-panel"
import { AiPanel } from "./ai-panel"

/** Shared width for every rail tab (templates, style, AI, …). */
const PANEL_DEFAULT_PX = 320
const PANEL_MIN_PX = 280
const PANEL_MAX_PX = 720
const PANEL_WIDTH_STORAGE_KEY = "mockmatch.cover-letter-editor.rail-width"

interface EditorRailProps {
  readonly letterId: string
  readonly activeTemplateId: EditorTemplateId
  readonly onTemplateChange: (id: EditorTemplateId) => void
  readonly style: DocumentStyle
  readonly onStyleChange: (patch: Partial<DocumentStyle>) => void
  readonly document: CoverLetterDocument
  readonly handlers: CoverLetterHandlers
  readonly permissions?: {
    canEditContent: boolean
    canEditDesign: boolean
    canUseAi: boolean
  }
  readonly onHistoryRestored?: (detail: {
    title: string
    templateId: string
    style: unknown
    document: unknown
  }) => void
  readonly children: ReactNode
}

function PanelBody({
  panel,
  letterId,
  activeTemplateId,
  onTemplateChange,
  style,
  onStyleChange,
  document,
  handlers,
  canRestore,
  onHistoryRestored,
}: {
  readonly panel: EditorPanelId
  readonly letterId: string
  readonly activeTemplateId: EditorTemplateId
  readonly onTemplateChange: (id: EditorTemplateId) => void
  readonly style: DocumentStyle
  readonly onStyleChange: (patch: Partial<DocumentStyle>) => void
  readonly document: CoverLetterDocument
  readonly handlers: CoverLetterHandlers
  readonly canRestore: boolean
  readonly onHistoryRestored?: EditorRailProps["onHistoryRestored"]
}) {
  switch (panel) {
    case "templates":
      return <TemplatesPanel activeTemplateId={activeTemplateId} onSelect={onTemplateChange} />
    case "style":
      return <StylePanel style={style} onChange={onStyleChange} />
    case "sections":
      return <SectionsPanel blocks={document.blocks} handlers={handlers} />
    case "analysis":
      return <GeneralAnalysisPanel document={document} />
    case "ai":
      return <AiPanel />
    case "history":
      return (
        <HistoryPanel
          kind="cover_letter"
          documentId={letterId}
          canRestore={canRestore}
          onRestored={onHistoryRestored}
          i18nNs="cover-letter-editor"
        />
      )
  }
}

function railItemAllowed(
  id: EditorPanelId,
  permissions?: EditorRailProps["permissions"]
): boolean {
  if (!permissions) return true
  if (id === "templates" || id === "style") return permissions.canEditDesign
  if (id === "sections") return permissions.canEditContent
  if (id === "ai") return permissions.canUseAi
  if (id === "analysis" || id === "history") return true
  return true
}

export function EditorRail({
  letterId,
  activeTemplateId,
  onTemplateChange,
  style,
  onStyleChange,
  document,
  handlers,
  permissions,
  onHistoryRestored,
  children,
}: EditorRailProps) {
  const { t } = useTranslation("cover-letter-editor")
  const assistant = useDocumentAssistantOptional()
  const visibleItems = EDITOR_RAIL_ITEMS.filter((item) =>
    railItemAllowed(item.id, permissions)
  )
  const defaultPanel = visibleItems[0]?.id ?? null
  const [activePanel, setActivePanel] = useState<EditorPanelId | null>(defaultPanel)

  const { width: panelWidth, startResize } = useSidePanelWidth({
    defaultWidth: PANEL_DEFAULT_PX,
    min: PANEL_MIN_PX,
    max: PANEL_MAX_PX,
    storageKey: PANEL_WIDTH_STORAGE_KEY,
  })

  const lastOpenRequestKey = useRef(0)
  const openRequestKey = assistant?.openRequestKey ?? 0
  useEffect(() => {
    if (openRequestKey === 0 || openRequestKey === lastOpenRequestKey.current) return
    lastOpenRequestKey.current = openRequestKey
    if (!railItemAllowed("ai", permissions)) return
    setActivePanel("ai")
  }, [openRequestKey, permissions])

  const toggle = (id: EditorPanelId) =>
    setActivePanel((current) => (current === id ? null : id))

  // Keep last panel content mounted during exit slide (must run before any early return)
  const lastPanelRef = useRef(activePanel)
  if (activePanel) lastPanelRef.current = activePanel
  const displayPanel = activePanel ?? lastPanelRef.current
  const isAiPanel = displayPanel === "ai"
  const panelOpen =
    activePanel != null && railItemAllowed(activePanel, permissions)

  if (visibleItems.length === 0) {
    return <div className="flex h-full min-h-0 w-full">{children}</div>
  }

  return (
    <TooltipProvider delay={300}>
      <div className="relative z-10 flex h-full min-h-0 w-full overflow-hidden">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}

          <CollapsibleSidePanel
            open={panelOpen}
            width={panelWidth}
            side="right"
            mode="overlay"
            slot="editor-side-panel"
            className="border-l border-border/60 bg-background text-foreground"
          >
            {displayPanel ? (
              <>
                <SidePanelResizeHandle
                  onPointerDown={startResize}
                  label={t("rail.resize")}
                />

                <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 pb-4 pt-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">
                      {t(`${displayPanel}.title`)}
                    </h2>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {t(`${displayPanel}.description`)}
                    </p>
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

                {isAiPanel ? (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <AiPanel />
                  </div>
                ) : (
                  <ScrollArea className="min-h-0 flex-1">
                    <div key={displayPanel} className="px-4 py-4">
                      <PanelBody
                        panel={displayPanel}
                        letterId={letterId}
                        activeTemplateId={activeTemplateId}
                        onTemplateChange={onTemplateChange}
                        style={style}
                        onStyleChange={onStyleChange}
                        document={document}
                        handlers={handlers}
                        canRestore={permissions?.canEditContent ?? true}
                        onHistoryRestored={onHistoryRestored}
                      />
                    </div>
                  </ScrollArea>
                )}
              </>
            ) : null}
          </CollapsibleSidePanel>
        </div>

        <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-l border-border/60 bg-background py-3 text-foreground">
          {visibleItems.map((item) => {
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
