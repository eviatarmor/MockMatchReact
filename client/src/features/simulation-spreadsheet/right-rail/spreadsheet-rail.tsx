import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { SimulationPromptRail } from "@/features/simulations/components/simulation-prompt-rail"

const PANEL_WIDTH_STORAGE_KEY = "mockmatch.spreadsheet.rail-width"

export type SpreadsheetRailProps = {
  readonly prompt: string
  readonly children: ReactNode
}

/**
 * Spreadsheet right rail — shared simulation prompt rail (prompt only).
 */
export function SpreadsheetRail({ prompt, children }: SpreadsheetRailProps) {
  const { t } = useTranslation("simulation-spreadsheet")

  return (
    <SimulationPromptRail
      prompt={prompt}
      storageKey={PANEL_WIDTH_STORAGE_KEY}
      slot="spreadsheet-side-panel"
      labels={{
        prompt: t("rail.prompt"),
        promptTitle: t("promptPanel.title"),
        promptDescription: t("promptPanel.description"),
        collapse: t("rail.collapse"),
        resize: t("rail.resize"),
      }}
    >
      {children}
    </SimulationPromptRail>
  )
}
