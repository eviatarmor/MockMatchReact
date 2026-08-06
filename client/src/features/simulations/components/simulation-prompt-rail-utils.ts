import { FileText, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import type { IconSideRailItem } from "@mockmatch/ui/icon-side-rail"

export type SimulationPromptRailExtraItem<Id extends string = string> = {
  readonly id: Id
  readonly icon: LucideIcon
  readonly label: string
  readonly title: string
  readonly description?: string
  readonly fill?: boolean
  readonly render: () => ReactNode
}

export type SimulationPromptRailLabels = {
  readonly prompt?: string
  readonly promptTitle?: string
  readonly promptDescription?: string
  readonly collapse?: string
  readonly resize?: string
}

export type ResolvedRailLabels = {
  readonly prompt: string
  readonly promptTitle: string
  readonly promptDescription: string
  readonly collapse: string
  readonly resize: string
}

type TranslateFn = (key: string) => string

type PanelId<ExtraId extends string> = "prompt" | ExtraId

/** Resolve host overrides against shared `common.simulations.promptRail` keys. */
export function resolvePromptRailLabels(
  labels: SimulationPromptRailLabels | undefined,
  t: TranslateFn
): ResolvedRailLabels {
  return {
    prompt: labels?.prompt ?? t("simulations.promptRail.prompt"),
    promptTitle:
      labels?.promptTitle ?? t("simulations.promptRail.promptPanel.title"),
    promptDescription:
      labels?.promptDescription ??
      t("simulations.promptRail.promptPanel.description"),
    collapse: labels?.collapse ?? t("simulations.promptRail.collapse"),
    resize: labels?.resize ?? t("simulations.promptRail.resize"),
  }
}

/** Build IconSideRail items: Prompt first, then optional extras. */
export function buildPromptRailItems<ExtraId extends string>(
  labels: ResolvedRailLabels,
  extraItems?: readonly SimulationPromptRailExtraItem<ExtraId>[]
): IconSideRailItem<PanelId<ExtraId>>[] {
  const items: IconSideRailItem<PanelId<ExtraId>>[] = [
    {
      id: "prompt" as PanelId<ExtraId>,
      icon: FileText,
      label: labels.prompt,
      title: labels.promptTitle,
      description: labels.promptDescription,
    },
  ]
  if (!extraItems) return items
  for (const item of extraItems) {
    items.push({
      id: item.id as PanelId<ExtraId>,
      icon: item.icon,
      label: item.label,
      title: item.title,
      description: item.description,
      fill: item.fill,
    })
  }
  return items
}
