import { AlignJustify, Clock, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { resolveIcon } from "@/lib/icon-map"
import type { InterviewTrack, DifficultyLevel } from "../types"

function difficultyVariant(level: DifficultyLevel): "outline" | "secondary" {
  return level === "adaptive" ? "outline" : "secondary"
}

interface SimulationTrackCardProps {
  readonly track: InterviewTrack
  readonly recommended?: boolean
}

export function SimulationTrackCard({ track, recommended = false }: SimulationTrackCardProps) {
  const { t } = useTranslation("common")
  const Icon = resolveIcon(track.iconName, AlignJustify)

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="flex flex-col items-end gap-1">
          {recommended ? (
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 text-primary text-[10px] px-1.5 py-0"
            >
              <Sparkles className="size-2.5" />
              {t("simulations.tracksBrowser.recommendedBadge")}
            </Badge>
          ) : null}
          <Badge variant={difficultyVariant(track.difficulty)}>
            {t(`simulations.difficulty.${track.difficulty}`)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold leading-snug">{t(track.titleKey)}</h3>
        <p className="text-xs text-muted-foreground leading-snug">{t(track.descriptionKey)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Badge variant="outline" className="font-normal text-[10px] px-1.5 py-0">
          {t(`simulations.format.${track.format}`)}
        </Badge>
        <span className="flex items-center gap-1">
          <AlignJustify className="size-3.5" />
          {t("simulations.taskCount", { count: track.taskCount })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" />
          {track.durationMin} min
        </span>
      </div>

      <Button variant="default" className="h-8 w-full gap-2 cursor-pointer">
        {t("simulations.startPractice")}
      </Button>
    </div>
  )
}
