import { AlignJustify, Clock, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { resolveIcon } from "@/lib/icon-map"
import { idePathForTrackId } from "@/features/simulation-ide/constants"
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
  const navigate = useNavigate()
  const Icon = resolveIcon(track.iconName, AlignJustify)
  const idePath = idePathForTrackId(track.id)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="flex flex-col items-end gap-1">
          {recommended ? (
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 px-1.5 py-0 text-2xs text-primary"
            >
              <Sparkles className="size-2.5" />
              {t("simulations.tracksBrowser.recommendedBadge")}
            </Badge>
          ) : null}
          <Badge variant={difficultyVariant(track.difficulty)} className="text-2xs">
            {t(`simulations.difficulty.${track.difficulty}`)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold leading-snug">{t(track.titleKey)}</h3>
        <p className="text-xs leading-snug text-muted-foreground">{t(track.descriptionKey)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Badge variant="outline" className="px-1.5 py-0 text-2xs font-normal">
          {t(`simulations.format.${track.format}`)}
        </Badge>
        <span className="flex items-center gap-1">
          <AlignJustify className="size-3.5" />
          {t("simulations.taskCount", { count: track.taskCount })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" />
          {track.durationMin} {t("simulations.recentSessions.durationSuffix")}
        </span>
      </div>

      <Button
        variant="default"
        className="h-8 w-full cursor-pointer gap-2"
        disabled={!idePath}
        onClick={() => {
          if (idePath) navigate(idePath)
        }}
      >
        {t("simulations.startPractice")}
      </Button>
    </div>
  )
}
