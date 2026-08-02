import { useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  FileText,
  LayoutTemplate,
  PanelRightClose,
  type LucideIcon,
} from "lucide-react"
import { CollapsibleSidePanel } from "@mockmatch/ui/collapsible-side-panel"
import { SidePanelResizeHandle } from "@mockmatch/ui/side-panel-resize-handle"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@/lib/utils"
import { useSidePanelWidth } from "@/hooks/use-side-panel-width"
import {
  WhiteboardTemplatesPanel,
  type WhiteboardTemplate,
  type WhiteboardTemplateId,
  type WhiteboardTemplatesPanelLabels,
} from "@mockmatch/whiteboard"

/** Match resume-editor rail width behavior. */
const PANEL_DEFAULT_PX = 320
const PANEL_MIN_PX = 280
const PANEL_MAX_PX = 720
const PANEL_WIDTH_STORAGE_KEY = "mockmatch.whiteboard.rail-width"

export type WhiteboardRailPanelId = "prompt" | "templates"

const RAIL_ITEMS: readonly {
  id: WhiteboardRailPanelId
  icon: LucideIcon
  labelKey: string
}[] = [
  { id: "prompt", icon: FileText, labelKey: "rail.prompt" },
  { id: "templates", icon: LayoutTemplate, labelKey: "rail.templates" },
]

export type WhiteboardRailProps = {
  readonly prompt: string
  readonly activeTemplateId: WhiteboardTemplateId | null
  readonly onSelectTemplate: (template: WhiteboardTemplate) => void
  readonly templateLabels: WhiteboardTemplatesPanelLabels
  readonly children: ReactNode
}

/**
 * Right icon rail + collapsible overlay panel — same chrome as resume EditorRail.
 */
export function WhiteboardRail({
  prompt,
  activeTemplateId,
  onSelectTemplate,
  templateLabels,
  children,
}: WhiteboardRailProps) {
  const { t } = useTranslation("simulation-whiteboard")
  const [activePanel, setActivePanel] = useState<WhiteboardRailPanelId | null>(
    "prompt"
  )

  const { width: panelWidth, startResize } = useSidePanelWidth({
    defaultWidth: PANEL_DEFAULT_PX,
    min: PANEL_MIN_PX,
    max: PANEL_MAX_PX,
    storageKey: PANEL_WIDTH_STORAGE_KEY,
  })

  const toggle = (id: WhiteboardRailPanelId) =>
    setActivePanel((current) => (current === id ? null : id))

  // Keep last panel content mounted during exit slide
  const lastPanelRef = useRef(activePanel)
  if (activePanel) lastPanelRef.current = activePanel
  const displayPanel = activePanel ?? lastPanelRef.current
  const panelOpen = activePanel != null

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
            slot="whiteboard-side-panel"
            className="border-l border-border/60 bg-background text-foreground"
          >
            {displayPanel ? (
              <div className="flex h-full min-h-0 flex-col">
                <SidePanelResizeHandle
                  onPointerDown={startResize}
                  label={t("rail.resize")}
                />

                <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/60 px-4 pb-4 pt-4">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">
                      {t(`${displayPanel}Panel.title`)}
                    </h2>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {t(`${displayPanel}Panel.description`)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 cursor-pointer text-muted-foreground"
                    onClick={() => setActivePanel(null)}
                    aria-label={t("rail.collapse")}
                  >
                    <PanelRightClose className="size-4" />
                  </Button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                  <div key={displayPanel} className="px-4 py-4">
                    {displayPanel === "prompt" ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {prompt}
                      </p>
                    ) : (
                      <WhiteboardTemplatesPanel
                        activeTemplateId={activeTemplateId}
                        onSelect={onSelectTemplate}
                        labels={templateLabels}
                        className="p-0"
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CollapsibleSidePanel>
        </div>

        <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-l border-border/60 bg-background py-3 text-foreground">
          {RAIL_ITEMS.map((item) => {
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
