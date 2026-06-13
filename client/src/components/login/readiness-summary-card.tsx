import { useEffect, useState } from "react"

import { ReadinessMessageTicker } from "@/components/login/readiness-message-ticker"
import { ReadinessProgressBar } from "@/components/login/readiness-progress-bar"
import type { ReadinessSummary } from "@/lib/login/types"

const ROTATE_INTERVAL_MS = 4000
const SCORE_STEP_MS = 30

interface ReadinessSummaryCardProps {
  readonly summary: ReadinessSummary
}

export function ReadinessSummaryCard({ summary }: ReadinessSummaryCardProps) {
  const { updates, maxScore } = summary
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const rotate = window.setInterval(() => {
      setIndex((current) => (current + 1) % updates.length)
    }, ROTATE_INTERVAL_MS)

    return () => window.clearInterval(rotate)
  }, [updates.length])

  useEffect(() => {
    const target = updates[index].score
    const tick = window.setInterval(() => {
      setScore((current) => {
        if (current === target) {
          window.clearInterval(tick)
          return current
        }
        return current < target ? current + 1 : current - 1
      })
    }, SCORE_STEP_MS)

    return () => window.clearInterval(tick)
  }, [index, updates])

  return (
    <div className="rounded-xl bg-white/10 p-5 text-white backdrop-blur-sm">
      <ReadinessProgressBar score={score} maxScore={maxScore} />
      <ReadinessMessageTicker updates={updates} index={index} />
    </div>
  )
}
