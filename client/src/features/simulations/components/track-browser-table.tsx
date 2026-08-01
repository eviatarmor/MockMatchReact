import { AlignJustify, Clock, Play, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { resolveIcon } from "@/lib/icon-map"
import { practicePathForTrackId } from "../lib/practice-path"
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
  const navigate = useNavigate()

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
        const practicePath = practicePathForTrackId(track.id)
        return (
          <tr
            key={track.id}
            className="group border-b border-border/40 transition-colors hover:bg-muted/5"
          >
            <td className="px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                      {t(track.titleKey)}
                    </span>
                    {isRecommended ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 gap-1 border-primary/30 px-1.5 py-0 text-2xs text-primary"
                      >
                        <Sparkles className="size-2.5" />
                        {t("simulations.tracksBrowser.recommendedBadge")}
                      </Badge>
                    ) : null}
                  </div>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {t(track.descriptionKey)}
                  </span>
                </div>
              </div>
            </td>
            <td className="hidden px-4 py-3 sm:table-cell">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {t(`simulations.format.${track.format}`)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("simulations.taskCount", { count: track.taskCount })}
                </span>
              </div>
            </td>
            <td className="px-4 py-3">
              <Badge variant={difficultyVariant(track.difficulty)} className="text-2xs">
                {t(`simulations.difficulty.${track.difficulty}`)}
              </Badge>
            </td>
            <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5 shrink-0" />
                {track.durationMin} {t("simulations.recentSessions.durationSuffix")}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  className="h-7 cursor-pointer gap-1.5 px-2 text-xs"
                  disabled={!practicePath}
                  onClick={() => {
                    if (practicePath) navigate(practicePath)
                  }}
                >
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
