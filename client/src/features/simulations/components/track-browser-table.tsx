import { AlignJustify, Clock, Play, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { resolveIcon } from "@/lib/icon-map"
import type { DifficultyLevel, InterviewTrack } from "../types"

function difficultyVariant(level: DifficultyLevel): "outline" | "secondary" {
  return level === "adaptive" ? "outline" : "secondary"
}

interface TrackBrowserTableProps {
  readonly tracks: readonly InterviewTrack[]
  readonly recommendedTrackIds?: ReadonlySet<string>
}

export function TrackBrowserTable({ tracks, recommendedTrackIds }: TrackBrowserTableProps) {
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
        const isRecommended = recommendedTrackIds?.has(track.id) ?? false
        return (
          <tr key={track.id} className="group hover:bg-muted/5 transition-colors">
            <td className="py-3 px-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                      {t(track.titleKey)}
                    </span>
                    {isRecommended ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 gap-1 border-primary/30 text-primary text-[10px] px-1.5 py-0"
                      >
                        <Sparkles className="size-2.5" />
                        {t("simulations.tracksBrowser.recommendedBadge")}
                      </Badge>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {t(track.descriptionKey)}
                  </span>
                </div>
              </div>
            </td>
            <td className="py-3 px-4 hidden sm:table-cell">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {t(`simulations.format.${track.format}`)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("simulations.taskCount", { count: track.taskCount })}
                </span>
              </div>
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
