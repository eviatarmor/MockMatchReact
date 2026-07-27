import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { StaggerItem } from "@/components/ui/stagger"
import { SimulationTrackCard } from "./simulation-track-card"
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
  const featured = tracks.slice(0, featuredCount)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">
            {t("simulations.tracksBrowser.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("simulations.tracksBrowser.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(browseAllTo)}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
        >
          {t("simulations.tracksBrowser.browseAll")}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {featured.map((track, index) => (
          <StaggerItem key={track.id} index={index} direction="left">
            <SimulationTrackCard track={track} />
          </StaggerItem>
        ))}
      </div>
    </div>
  )
}
