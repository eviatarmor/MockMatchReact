import { CheckCircle2, Circle, XCircle } from "lucide-react"

export function ItemStatusIcon({
  result,
}: {
  readonly result?: { correct: boolean }
}) {
  if (!result) {
    return <Circle className="mt-0.5 size-3.5 shrink-0 opacity-40" />
  }
  if (result.correct) {
    return (
      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
    )
  }
  return <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
}
