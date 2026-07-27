import { AlignJustify, Clock, Play } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { resolveIcon } from "@/lib/icon-map"
import type { DifficultyLevel, InterviewTrack } from "../types"

function difficultyVariant(level: DifficultyLevel): "outline" | "secondary" {
  return level === "adaptive" ? "outline" : "secondary"
}

interface TrackBrowserTableProps {
  readonly tracks: readonly InterviewTrack[]
}

export function TrackBrowserTable({ tracks }: TrackBrowserTableProps) {
  const { t } = useTranslation("common")

  const columns: EntityTableColumn[] = [
    { key: "track", label: t("simulations.tracksBrowser.columns.track") },
    {
      key: "format",
      label: t("simulations.tracksBrowser.columns.format"),
      className: "hidden sm:table-cell",
    },
    { key: "difficulty", label: t("simulations.tracksBrowser.columns.difficulty") },
    {
      key: "duration",
      label: t("simulations.tracksBrowser.columns.duration"),
      className: "hidden md:table-cell",
    },
    {
      key: "action",
      label: t("simulations.tracksBrowser.columns.action"),
      className: "text-right",
    },
  ]

  return (
    <EntityTable
      columns={columns}
      isEmpty={tracks.length === 0}
      emptyMessage={t("simulations.tracksBrowser.noResults")}
    >
      {tracks.map((track) => {
        const Icon = resolveIcon(track.iconName, AlignJustify)
        return (
          <tr key={track.id} className="group hover:bg-muted/5 transition-colors">
            <td className="py-3 px-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {t(track.titleKey)}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {t(track.descriptionKey)}
                  </span>
                </div>
              </div>
            </td>
            <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
              <span className="flex items-center gap-1">
                <AlignJustify className="size-3.5 shrink-0" />
                {track.metaCount} {t(`simulations.metaKind.${track.metaKind}`)}
              </span>
            </td>
            <td className="py-3 px-4">
              <Badge variant={difficultyVariant(track.difficulty)}>
                {t(`simulations.difficulty.${track.difficulty}`)}
              </Badge>
            </td>
            <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {track.durationMin} {t("simulations.recentSessions.durationSuffix")}
              </span>
            </td>
            <td className="py-3 px-4">
              <div className="flex items-center justify-end">
                <Button variant="ghost" className="h-7 gap-1.5 px-2 text-xs cursor-pointer">
                  <Play className="size-3" />
                  {t("simulations.startPractice")}
                </Button>
              </div>
            </td>
          </tr>
        )
      })}
    </EntityTable>
  )
}
