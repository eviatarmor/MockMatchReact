import { ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import { trpc } from "@/lib/trpc"
import type { BankQuestion } from "@/features/question-bank/types"
import { SimulationTrackCard } from "./simulation-track-card"

interface TrackBrowserSectionProps {
  readonly browseAllTo: string
  readonly featuredCount?: number
}

/** Featured bank questions strip + link to full browse page. */
export function TrackBrowserSection({
  browseAllTo,
  featuredCount = 5,
}: TrackBrowserSectionProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()

  const listQuery = trpc.questions.list.useQuery({
    page: 1,
    pageSize: featuredCount,
  })

  const featured: BankQuestion[] = (listQuery.data?.items ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    domain: q.domain,
    difficulty: q.difficulty,
    company: q.company,
    status: q.status,
    format: q.format,
    trackHint: q.trackHint,
  }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-medium text-foreground">
            {t("simulations.tracksBrowser.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("simulations.tracksBrowser.description")}
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

      {listQuery.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RobotLoader
            size="sm"
            label={t("questionBank.loading", {
              defaultValue: "Loading questions…",
            })}
          />
        </div>
      ) : featured.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("questionBank.emptyDescription", {
            defaultValue:
              "Apply to a job in Discover or import a job in Applications — questions generate automatically into this bank.",
          })}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {featured.map((question, index) => (
            <StaggerItem key={question.id} index={index} direction="left">
              <SimulationTrackCard question={question} />
            </StaggerItem>
          ))}
        </div>
      )}
    </div>
  )
}
