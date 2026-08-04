import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { FileText, LayoutTemplate, Shapes } from "lucide-react"
import {
  IconSideRail,
  type IconSideRailItem,
} from "@mockmatch/ui/icon-side-rail"
import { StaggerMarkdown } from "@mockmatch/ui/markdown"
import {
  WhiteboardStencilsPanel,
  WhiteboardTemplatesPanel,
  type StencilDef,
  type WhiteboardStencilsPanelLabels,
  type WhiteboardTemplate,
  type WhiteboardTemplateId,
  type WhiteboardTemplatesPanelLabels,
} from "@mockmatch/whiteboard"

const PANEL_WIDTH_STORAGE_KEY = "mockmatch.whiteboard.rail-width"

export type WhiteboardRailPanelId = "prompt" | "templates" | "stencils"

export type WhiteboardRailProps = {
  readonly prompt: string
  readonly activeTemplateId: WhiteboardTemplateId | null
  readonly onSelectTemplate: (template: WhiteboardTemplate) => void
  readonly templateLabels: WhiteboardTemplatesPanelLabels
  readonly stencilLabels: WhiteboardStencilsPanelLabels
  readonly onPlaceStencil: (stencil: StencilDef) => void
  readonly children: ReactNode
}

/**
 * Right icon rail + collapsible panel — shared {@link IconSideRail} chrome.
 */
export function WhiteboardRail({
  prompt,
  activeTemplateId,
  onSelectTemplate,
  templateLabels,
  stencilLabels,
  onPlaceStencil,
  children,
}: WhiteboardRailProps) {
  const { t } = useTranslation("simulation-whiteboard")

  const items = useMemo(
    (): IconSideRailItem<WhiteboardRailPanelId>[] => [
      {
        id: "prompt",
        icon: FileText,
        label: t("rail.prompt"),
        title: t("promptPanel.title"),
        description: t("promptPanel.description"),
      },
      {
        id: "templates",
        icon: LayoutTemplate,
        label: t("rail.templates"),
        title: t("templatesPanel.title"),
        description: t("templatesPanel.description"),
      },
      {
        id: "stencils",
        icon: Shapes,
        label: t("rail.stencils"),
        title: t("stencilsPanel.title"),
        description: t("stencilsPanel.description"),
      },
    ],
    [t]
  )

  return (
    <IconSideRail
      items={items}
      defaultActiveId="prompt"
      collapseLabel={t("rail.collapse")}
      resizeLabel={t("rail.resize")}
      storageKey={PANEL_WIDTH_STORAGE_KEY}
      slot="whiteboard-side-panel"
      renderPanel={(id) => {
        if (id === "prompt") return <StaggerMarkdown>{prompt}</StaggerMarkdown>
        if (id === "templates") {
          return (
            <WhiteboardTemplatesPanel
              activeTemplateId={activeTemplateId}
              onSelect={onSelectTemplate}
              labels={templateLabels}
              className="p-0"
            />
          )
        }
        return (
          <WhiteboardStencilsPanel
            onPlace={onPlaceStencil}
            labels={stencilLabels}
            className="p-0"
          />
        )
      }}
    >
      {children}
    </IconSideRail>
  )
}
