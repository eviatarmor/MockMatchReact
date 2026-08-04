import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import {
  IconSideRail,
  type IconSideRailItem,
} from "@mockmatch/ui/icon-side-rail"
import { StaggerMarkdown } from "@mockmatch/ui/markdown"

const PANEL_WIDTH_STORAGE_KEY = "mockmatch.spreadsheet.rail-width"

export type SpreadsheetRailProps = {
  readonly prompt: string
  readonly children: ReactNode
}

/**
 * Spreadsheet right rail — shared {@link IconSideRail} + markdown prompt.
 */
export function SpreadsheetRail({ prompt, children }: SpreadsheetRailProps) {
  const { t } = useTranslation("simulation-spreadsheet")

  const items = useMemo(
    (): IconSideRailItem<"prompt">[] => [
      {
        id: "prompt",
        icon: FileText,
        label: t("rail.prompt"),
        title: t("promptPanel.title"),
        description: t("promptPanel.description"),
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
      slot="spreadsheet-side-panel"
      renderPanel={() => <StaggerMarkdown>{prompt}</StaggerMarkdown>}
    >
      {children}
    </IconSideRail>
  )
}
