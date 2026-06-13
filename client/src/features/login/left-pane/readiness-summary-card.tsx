import { useEffect, useState } from "react"

import { ReadinessMessageTicker } from "@/features/login/left-pane/readiness-message-ticker"
import { ReadinessProgressBar } from "@/features/login/left-pane/readiness-progress-bar"
import type { ReadinessSummary } from "@/features/login/types"

const ROTATE_INTERVAL_MS = 4000

interface ReadinessSummaryCardProps {
  readonly summary: ReadinessSummary
}

export function ReadinessSummaryCard({ summary }: ReadinessSummaryCardProps) {
  const { updates, maxScore } = summary
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const rotate = window.setInterval(() => {
      setIndex((current) => (current + 1) % updates.length)
    }, ROTATE_INTERVAL_MS)

    return () => window.clearInterval(rotate)
  }, [updates.length])

  return (
    <div className="rounded-xl bg-white/10 p-5 text-white backdrop-blur-sm">
      <ReadinessProgressBar score={updates[index].score} maxScore={maxScore} />
      <ReadinessMessageTicker updates={updates} index={index} />
    </div>
  )
}
