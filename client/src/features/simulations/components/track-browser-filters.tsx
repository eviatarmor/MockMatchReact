import { useTranslation } from "react-i18next"
import { Checkbox } from "@mockmatch/ui/checkbox"
import {
  INTERVIEW_TRACKS,
  TRACK_DIFFICULTIES,
  TRACK_DURATION_BUCKETS,
  TRACK_FORMATS,
  TRACK_ROLE_FAMILIES,
} from "../constants"
import { durationBucket } from "../lib/track-filters"
import type {
  DifficultyLevel,
  DurationBucket,
  TrackFormat,
  TrackRoleFamily,
} from "../types"

function countByDifficulty(d: DifficultyLevel) {
  return INTERVIEW_TRACKS.filter((track) => track.difficulty === d).length
}

function countByFormat(format: TrackFormat) {
  return INTERVIEW_TRACKS.filter((track) => track.format === format).length
}

function countByRoleFamily(family: TrackRoleFamily) {
  return INTERVIEW_TRACKS.filter((track) => track.roleFamilies.includes(family)).length
}

function countByDuration(bucket: DurationBucket) {
  return INTERVIEW_TRACKS.filter((track) => durationBucket(track.durationMin) === bucket).length
}

interface TrackBrowserFiltersProps {
  readonly selectedRoleFamilies: Set<TrackRoleFamily>
  readonly selectedDifficulties: Set<DifficultyLevel>
  readonly selectedFormats: Set<TrackFormat>
  readonly selectedDurations: Set<DurationBucket>
  readonly onRoleFamilyToggle: (f: TrackRoleFamily) => void
  readonly onDifficultyToggle: (d: DifficultyLevel) => void
  readonly onFormatToggle: (f: TrackFormat) => void
  readonly onDurationToggle: (b: DurationBucket) => void
}

export function TrackBrowserFilters({
  selectedRoleFamilies,
  selectedDifficulties,
  selectedFormats,
  selectedDurations,
  onRoleFamilyToggle,
  onDifficultyToggle,
  onFormatToggle,
  onDurationToggle,
}: TrackBrowserFiltersProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card/40 p-3 shadow-sm">
      <span className="text-sm font-semibold text-foreground">
        {t("simulations.tracksBrowser.filters.title")}
      </span>

      <section className="flex flex-col gap-2">
        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("simulations.tracksBrowser.filters.roleFamily")}
        </p>
        {TRACK_ROLE_FAMILIES.map((family) => (
          <label key={family} className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedRoleFamilies.has(family)}
                onCheckedChange={() => onRoleFamilyToggle(family)}
              />
              <span className="text-sm">{t(`simulations.roleFamily.${family}`)}</span>
            </div>
            <span className="text-2xs tabular-nums text-muted-foreground">
              {countByRoleFamily(family)}
            </span>
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
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
            <span className="text-2xs tabular-nums text-muted-foreground">
              {countByDifficulty(d)}
            </span>
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("simulations.tracksBrowser.filters.duration")}
        </p>
        {TRACK_DURATION_BUCKETS.map((bucket) => (
          <label key={bucket} className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedDurations.has(bucket)}
                onCheckedChange={() => onDurationToggle(bucket)}
              />
              <span className="text-sm">{t(`simulations.durationBucket.${bucket}`)}</span>
            </div>
            <span className="text-2xs tabular-nums text-muted-foreground">
              {countByDuration(bucket)}
            </span>
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("simulations.tracksBrowser.filters.format")}
        </p>
        {TRACK_FORMATS.map((format) => (
          <label key={format} className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Checkbox
                checked={selectedFormats.has(format)}
                onCheckedChange={() => onFormatToggle(format)}
              />
              <span className="text-sm leading-snug">{t(`simulations.format.${format}`)}</span>
            </div>
            <span className="shrink-0 text-2xs tabular-nums text-muted-foreground">
              {countByFormat(format)}
            </span>
          </label>
        ))}
      </section>
    </div>
  )
}
