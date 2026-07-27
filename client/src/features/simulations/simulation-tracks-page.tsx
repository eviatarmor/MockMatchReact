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
import type { DifficultyLevel, TrackMetaKind } from "./types"

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
  const [search, setSearch] = useState("")
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<DifficultyLevel>>(
    new Set()
  )
  const [selectedMetaKinds, setSelectedMetaKinds] = useState<Set<TrackMetaKind>>(new Set())

  const filtered = useMemo(
    () =>
      INTERVIEW_TRACKS.filter((track) => {
        const needle = search.trim().toLowerCase()
        const title = t(track.titleKey).toLowerCase()
        const description = t(track.descriptionKey).toLowerCase()
        const matchesSearch =
          needle.length === 0 || title.includes(needle) || description.includes(needle)
        const matchesDifficulty =
          selectedDifficulties.size === 0 || selectedDifficulties.has(track.difficulty)
        const matchesMeta =
          selectedMetaKinds.size === 0 || selectedMetaKinds.has(track.metaKind)
        return matchesSearch && matchesDifficulty && matchesMeta
      }),
    [search, selectedDifficulties, selectedMetaKinds, t]
  )

  return (
    <DashboardPageShell title={t("simulations.tracksBrowser.browseTitle")}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate("/simulations")}
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
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
          <aside className="sticky top-[10px] hidden w-44 shrink-0 self-start lg:block">
            <TrackBrowserFilters
              selectedDifficulties={selectedDifficulties}
              selectedMetaKinds={selectedMetaKinds}
              onDifficultyToggle={(d) =>
                toggleSet(selectedDifficulties, d, setSelectedDifficulties)
              }
              onMetaKindToggle={(k) => toggleSet(selectedMetaKinds, k, setSelectedMetaKinds)}
            />
          </aside>

          <div className="flex flex-1 flex-col gap-3 min-w-0">
            <TableToolbar
              searchPlaceholder={t("simulations.tracksBrowser.searchPlaceholder")}
              search={search}
              onSearchChange={setSearch}
              searchClassName="max-w-full sm:max-w-xs"
            />
            <TrackBrowserTable tracks={filtered} />
          </div>
        </div>
      </div>
    </DashboardPageShell>
  )
}
