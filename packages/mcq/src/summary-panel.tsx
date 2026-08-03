import { RotateCcw } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { ItemStatusIcon } from "./item-status-icon"
import type { McqItemState, McqQuestion, McqShellLabels } from "./types"

export function SummaryPanel({
  questions,
  itemState,
  correctCount,
  labels,
  onRestart,
  onBank,
  onReview,
}: {
  readonly questions: readonly McqQuestion[]
  readonly itemState: Record<string, McqItemState>
  readonly correctCount: number
  readonly labels: McqShellLabels
  readonly onRestart: () => void
  readonly onBank: () => void
  readonly onReview: (index: number) => void
}) {
  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-medium">{labels.summary.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {labels.summary.score(correctCount, questions.length)}
        </p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {questions.map((q, i) => {
          const r = itemState[q.id]?.result
          return (
            <li key={q.id}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-left text-sm hover:bg-muted/40"
                onClick={() => onReview(i)}
              >
                <ItemStatusIcon result={r} />
                <span className="min-w-0 flex-1 truncate">{q.title}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button className="h-9 cursor-pointer gap-1.5" onClick={onRestart}>
          <RotateCcw className="size-3.5" />
          {labels.actions.restart}
        </Button>
        <Button
          variant="secondary"
          className="h-9 cursor-pointer"
          onClick={onBank}
        >
          {labels.actions.bank}
        </Button>
      </div>
    </div>
  )
}
