import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import { trpc } from "@/lib/trpc"
import { SimulationIdePageContent } from "@/features/simulation-ide/simulation-ide-page"
import { SimulationMcqPageContent } from "@/features/simulation-mcq/simulation-mcq-page"
import { SimulationWhiteboardPageContent } from "@/features/simulation-whiteboard/simulation-whiteboard-page"
import { SimulationConversationPageContent } from "@/features/simulation-conversation/simulation-conversation-page"
import { SimulationSpreadsheetPageContent } from "@/features/simulation-spreadsheet/simulation-spreadsheet-page"
import { SimulationPagePageContent } from "@/features/simulation-page/simulation-page-page"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Bank practice entry: `/simulations/:questionId`.
 * Loads question format once, then mounts the matching practice surface.
 */
export function SimulationQuestionPageContent() {
  const { questionId } = useParams<{ questionId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation("common")

  const validId = Boolean(questionId && UUID_RE.test(questionId))

  const summary = trpc.questions.get.useQuery(
    { id: questionId! },
    {
      enabled: validId,
      retry: false,
      staleTime: 60_000,
    }
  )

  if (!validId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
        <p>{t("simulations.questionNotFound", { defaultValue: "Question not found." })}</p>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate("/simulations")}
        >
          {t("simulations.backToSimulations", {
            defaultValue: "Back to Simulations",
          })}
        </Button>
      </div>
    )
  }

  // Only block on first load — background refetches must not unmount the surface
  // (child queries would remount → re-fetch → isFetching loop → empty sessions UX).
  if (summary.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
        <RobotLoader
          size="md"
          label={t("simulations.loadingQuestion", {
            defaultValue: "Loading practice…",
          })}
        />
      </div>
    )
  }

  if (summary.isError || !summary.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
        <p>
          {t("simulations.questionNotFound", {
            defaultValue: "Question not found.",
          })}
        </p>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate("/simulations")}
        >
          {t("simulations.backToSimulations", {
            defaultValue: "Back to Simulations",
          })}
        </Button>
      </div>
    )
  }

  switch (summary.data.format) {
    case "mcq":
      return <SimulationMcqPageContent />
    case "whiteboard":
      return <SimulationWhiteboardPageContent />
    case "conversation":
      return <SimulationConversationPageContent />
    case "spreadsheet":
      return <SimulationSpreadsheetPageContent />
    case "page":
      return <SimulationPagePageContent />
    case "code_run":
    case "workspace":
    case "terminal":
      return <SimulationIdePageContent />
    default:
      return <SimulationIdePageContent />
  }
}
