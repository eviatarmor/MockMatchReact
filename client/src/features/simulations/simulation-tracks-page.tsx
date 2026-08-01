import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { TrackBrowserFilters } from "./components/track-browser-filters"
import { TrackBrowserTable } from "./components/track-browser-table"
import { INTERVIEW_TRACKS } from "./constants"
import { useResumeRoleHints } from "./hooks/use-resume-role-hints"
import { durationBucket, isTrackRecommended } from "./lib/track-filters"
import type {
  DifficultyLevel,
  DurationBucket,
  TrackFormat,
  TrackRoleFamily,
} from "./types"

function toggleSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
  const next = new Set(set)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  setter(next)
}

export function SimulationTracksPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const roleHints = useResumeRoleHints()

  const [search, setSearch] = useState("")
  const [selectedRoleFamilies, setSelectedRoleFamilies] = useState<Set<TrackRoleFamily>>(
    new Set()
  )
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<DifficultyLevel>>(
    new Set()
  )
  const [selectedFormats, setSelectedFormats] = useState<Set<TrackFormat>>(new Set())
  const [selectedDurations, setSelectedDurations] = useState<Set<DurationBucket>>(new Set())

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const list = INTERVIEW_TRACKS.filter((track) => {
      const title = t(track.titleKey).toLowerCase()
      const description = t(track.descriptionKey).toLowerCase()
      const formatLabel = t(`simulations.format.${track.format}`).toLowerCase()
      const matchesSearch =
        needle.length === 0 ||
        title.includes(needle) ||
        description.includes(needle) ||
        formatLabel.includes(needle)
      const matchesRole =
        selectedRoleFamilies.size === 0 ||
        track.roleFamilies.some((f) => selectedRoleFamilies.has(f))
      const matchesDifficulty =
        selectedDifficulties.size === 0 || selectedDifficulties.has(track.difficulty)
      const matchesFormat =
        selectedFormats.size === 0 || selectedFormats.has(track.format)
      const matchesDuration =
        selectedDurations.size === 0 ||
        selectedDurations.has(durationBucket(track.durationMin))
      return (
        matchesSearch &&
        matchesRole &&
        matchesDifficulty &&
        matchesFormat &&
        matchesDuration
      )
    })

    // Recommended first when we know the user's role families
    if (roleHints.canRecommend) {
      return [...list].sort((a, b) => {
        const aRec = isTrackRecommended(a, roleHints.families) ? 0 : 1
        const bRec = isTrackRecommended(b, roleHints.families) ? 0 : 1
        return aRec - bRec
      })
    }
    return list
  }, [
    search,
    selectedRoleFamilies,
    selectedDifficulties,
    selectedFormats,
    selectedDurations,
    roleHints.families,
    roleHints.canRecommend,
    t,
  ])

  return (
    <DashboardPageShell title={t("simulations.tracksBrowser.browseTitle")}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate("/simulations")}
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("simulations.tracksBrowser.browseBackLink")}
          </button>
          <DashboardPageHeader
            title={t("simulations.tracksBrowser.browseTitle")}
            description={t("simulations.tracksBrowser.browseDescription", {
              count: INTERVIEW_TRACKS.length,
            })}
          />
        </div>

        <div className="flex flex-1 items-start gap-4 min-h-0">
          <aside className="sticky top-[10px] hidden w-48 shrink-0 self-start lg:block">
            <TrackBrowserFilters
              selectedRoleFamilies={selectedRoleFamilies}
              selectedDifficulties={selectedDifficulties}
              selectedFormats={selectedFormats}
              selectedDurations={selectedDurations}
              onRoleFamilyToggle={(f) =>
                toggleSet(selectedRoleFamilies, f, setSelectedRoleFamilies)
              }
              onDifficultyToggle={(d) =>
                toggleSet(selectedDifficulties, d, setSelectedDifficulties)
              }
              onFormatToggle={(f) => toggleSet(selectedFormats, f, setSelectedFormats)}
              onDurationToggle={(b) => toggleSet(selectedDurations, b, setSelectedDurations)}
            />
          </aside>

          <div className="flex flex-1 flex-col gap-3 min-w-0">
            <TableToolbar
              searchPlaceholder={t("simulations.tracksBrowser.searchPlaceholder")}
              search={search}
              onSearchChange={setSearch}
              searchClassName="max-w-full sm:max-w-xs"
            />
            <TrackBrowserTable
              tracks={filtered}
              recommendedTrackIds={
                roleHints.canRecommend
                  ? new Set(
                      INTERVIEW_TRACKS.filter((track) =>
                        isTrackRecommended(track, roleHints.families)
                      ).map((track) => track.id)
                    )
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </DashboardPageShell>
  )
}
