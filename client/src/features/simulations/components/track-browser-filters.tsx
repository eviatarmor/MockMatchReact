import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import {
  INTERVIEW_TRACKS,
  TRACK_DIFFICULTIES,
  TRACK_META_KINDS,
} from "../constants"
import type { DifficultyLevel, TrackMetaKind } from "../types"

function countByDifficulty(d: DifficultyLevel) {
  return INTERVIEW_TRACKS.filter((track) => track.difficulty === d).length
}

function countByMetaKind(kind: TrackMetaKind) {
  return INTERVIEW_TRACKS.filter((track) => track.metaKind === kind).length
}

interface TrackBrowserFiltersProps {
  readonly selectedDifficulties: Set<DifficultyLevel>
  readonly selectedMetaKinds: Set<TrackMetaKind>
  readonly onDifficultyToggle: (d: DifficultyLevel) => void
  readonly onMetaKindToggle: (k: TrackMetaKind) => void
}

export function TrackBrowserFilters({
  selectedDifficulties,
  selectedMetaKinds,
  onDifficultyToggle,
  onMetaKindToggle,
}: TrackBrowserFiltersProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-5">
      <span className="text-sm font-semibold">{t("simulations.tracksBrowser.filters.title")}</span>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("simulations.tracksBrowser.filters.difficulty")}
        </p>
        {TRACK_DIFFICULTIES.map((d) => (
          <label key={d} className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedDifficulties.has(d)}
                onCheckedChange={() => onDifficultyToggle(d)}
              />
              <span className="text-sm">{t(`simulations.difficulty.${d}`)}</span>
            </div>
            <span className="text-xs text-muted-foreground">{countByDifficulty(d)}</span>
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("simulations.tracksBrowser.filters.format")}
        </p>
        {TRACK_META_KINDS.map((kind) => (
          <label key={kind} className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedMetaKinds.has(kind)}
                onCheckedChange={() => onMetaKindToggle(kind)}
              />
              <span className="text-sm">{t(`simulations.metaKind.${kind}`)}</span>
            </div>
            <span className="text-xs text-muted-foreground">{countByMetaKind(kind)}</span>
          </label>
        ))}
      </section>
    </div>
  )
}
