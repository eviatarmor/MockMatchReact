import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  IconSideRail,
} from "@mockmatch/ui/icon-side-rail"
import { StaggerMarkdown } from "@mockmatch/ui/markdown"
import {
  buildPromptRailItems,
  resolvePromptRailLabels,
  type SimulationPromptRailExtraItem,
  type SimulationPromptRailLabels,
} from "./simulation-prompt-rail-utils"

export type {
  SimulationPromptRailExtraItem,
  SimulationPromptRailLabels,
} from "./simulation-prompt-rail-utils"

const DEFAULT_STORAGE_KEY = "mockmatch.simulation.prompt-rail-width"

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
