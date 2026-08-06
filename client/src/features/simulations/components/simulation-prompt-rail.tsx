import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { FileText, type LucideIcon } from "lucide-react"
import {
  IconSideRail,
  type IconSideRailItem,
} from "@mockmatch/ui/icon-side-rail"
import { StaggerMarkdown } from "@mockmatch/ui/markdown"

const DEFAULT_STORAGE_KEY = "mockmatch.simulation.prompt-rail-width"

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

export type SimulationPromptRailProps<ExtraId extends string = never> = {
  readonly prompt: string
  readonly children: ReactNode
  /** Persist panel width per surface (defaults to shared key). */
  readonly storageKey?: string
  readonly slot?: string
  readonly labels?: SimulationPromptRailLabels
  /** Extra panels after Prompt (templates, stencils, …). */
  readonly extraItems?: readonly SimulationPromptRailExtraItem<ExtraId>[]
  readonly className?: string
  readonly defaultActiveId?: "prompt" | ExtraId | null
}

type PanelId<ExtraId extends string> = "prompt" | ExtraId

type ResolvedRailLabels = {
  readonly prompt: string
  readonly promptTitle: string
  readonly promptDescription: string
  readonly collapse: string
  readonly resize: string
}

type TranslateFn = (key: string) => string

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

/**
 * Shared simulation right rail — prompt markdown + optional surface panels.
 * Same {@link IconSideRail} chrome as whiteboard / spreadsheet.
 * Not used by MCQ or conversation/voice (interactive surfaces, not prompt workspaces).
 */
export function SimulationPromptRail<ExtraId extends string = never>({
  prompt,
  children,
  storageKey = DEFAULT_STORAGE_KEY,
  slot = "simulation-prompt-rail",
  labels,
  extraItems,
  className,
  defaultActiveId = "prompt",
}: SimulationPromptRailProps<ExtraId>) {
  const { t } = useTranslation("common")
  const resolved = useMemo(() => resolvePromptRailLabels(labels, t), [labels, t])
  const items = useMemo(
    () => buildPromptRailItems(resolved, extraItems),
    [extraItems, resolved]
  )
  const extraById = useMemo(() => {
    const map = new Map<string, SimulationPromptRailExtraItem<ExtraId>>()
    for (const item of extraItems ?? []) map.set(item.id, item)
    return map
  }, [extraItems])

  return (
    <IconSideRail
      items={items}
      defaultActiveId={defaultActiveId}
      collapseLabel={resolved.collapse}
      resizeLabel={resolved.resize}
      storageKey={storageKey}
      slot={slot}
      className={className}
      renderPanel={(id) => {
        if (id === "prompt") return <StaggerMarkdown>{prompt}</StaggerMarkdown>
        return extraById.get(id)?.render() ?? null
      }}
    >
      {children}
    </IconSideRail>
  )
}
