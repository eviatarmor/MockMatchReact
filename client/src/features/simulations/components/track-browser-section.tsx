import { useMemo } from "react"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { SimulationTrackCard } from "./simulation-track-card"
import { useResumeRoleHints } from "../hooks/use-resume-role-hints"
import { isTrackRecommended } from "../lib/track-filters"
import type { InterviewTrack } from "../types"

interface TrackBrowserSectionProps {
  readonly tracks: readonly InterviewTrack[]
  readonly browseAllTo: string
  readonly featuredCount?: number
}

/** Featured interview-track strip + link to full browse page. */
export function TrackBrowserSection({
  tracks,
  browseAllTo,
  featuredCount = 5,
}: TrackBrowserSectionProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const roleHints = useResumeRoleHints()

  const featured = useMemo(() => {
    if (!roleHints.canRecommend) {
      return tracks.slice(0, featuredCount)
    }
    const sorted = [...tracks].sort((a, b) => {
      const aRec = isTrackRecommended(a, roleHints.families) ? 0 : 1
      const bRec = isTrackRecommended(b, roleHints.families) ? 0 : 1
      return aRec - bRec
    })
    return sorted.slice(0, featuredCount)
  }, [tracks, featuredCount, roleHints.canRecommend, roleHints.families])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-medium text-foreground">
            {t("simulations.tracksBrowser.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {roleHints.canRecommend && roleHints.sourceLabels.length > 0
              ? t("simulations.tracksBrowser.descriptionRecommended", {
                  roles: roleHints.sourceLabels.join(", "),
                })
              : t("simulations.tracksBrowser.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(browseAllTo)}
          className="flex shrink-0 cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("simulations.tracksBrowser.browseAll")}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {featured.map((track, index) => (
          <StaggerItem key={track.id} index={index} direction="left">
            <SimulationTrackCard
              track={track}
              recommended={
                roleHints.canRecommend && isTrackRecommended(track, roleHints.families)
              }
            />
          </StaggerItem>
        ))}
      </div>
    </div>
  )
}
