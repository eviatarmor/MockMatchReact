import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { LayoutTemplate, Shapes } from "lucide-react"
import {
  WhiteboardStencilsPanel,
  WhiteboardTemplatesPanel,
  type StencilDef,
  type WhiteboardStencilsPanelLabels,
  type WhiteboardTemplate,
  type WhiteboardTemplateId,
  type WhiteboardTemplatesPanelLabels,
} from "@mockmatch/whiteboard"
import {
  SimulationPromptRail,
  type SimulationPromptRailExtraItem,
} from "@/features/simulations/components/simulation-prompt-rail"

const PANEL_WIDTH_STORAGE_KEY = "mockmatch.whiteboard.rail-width"

export type WhiteboardRailPanelId = "templates" | "stencils"

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
 * Whiteboard right rail — shared simulation prompt rail + templates / stencils.
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

  const extraItems = useMemo(
    (): SimulationPromptRailExtraItem<WhiteboardRailPanelId>[] => [
      {
        id: "templates",
        icon: LayoutTemplate,
        label: t("rail.templates"),
        title: t("templatesPanel.title"),
        description: t("templatesPanel.description"),
        render: () => (
          <WhiteboardTemplatesPanel
            activeTemplateId={activeTemplateId}
            onSelect={onSelectTemplate}
            labels={templateLabels}
            className="p-0"
          />
        ),
      },
      {
        id: "stencils",
        icon: Shapes,
        label: t("rail.stencils"),
        title: t("stencilsPanel.title"),
        description: t("stencilsPanel.description"),
        render: () => (
          <WhiteboardStencilsPanel
            onPlace={onPlaceStencil}
            labels={stencilLabels}
            className="p-0"
          />
        ),
      },
    ],
    [
      activeTemplateId,
      onPlaceStencil,
      onSelectTemplate,
      stencilLabels,
      t,
      templateLabels,
    ]
  )

  return (
    <SimulationPromptRail
      prompt={prompt}
      storageKey={PANEL_WIDTH_STORAGE_KEY}
      slot="whiteboard-side-panel"
      labels={{
        prompt: t("rail.prompt"),
        promptTitle: t("promptPanel.title"),
        promptDescription: t("promptPanel.description"),
        collapse: t("rail.collapse"),
        resize: t("rail.resize"),
      }}
      extraItems={extraItems}
    >
      {children}
    </SimulationPromptRail>
  )
}
