import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import type { ReadinessSummary } from "@/lib/auth/types"

const ROTATE_INTERVAL_MS = 4000
const SCORE_STEP_MS = 30
const ROW_HEIGHT_PX = 20

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

  const progressPercent = (score / maxScore) * 100

  return (
    <div className="rounded-xl bg-white/10 p-5 text-white backdrop-blur-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-white/80">Your readiness</span>
        <span className="text-2xl font-bold">
          {score}
          <span className="text-base font-normal text-white/60">
            {" "}
            / {maxScore}
          </span>
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-200 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-3 h-5 overflow-hidden">
        <div
          className="transition-transform duration-500 ease-in-out"
          style={{ transform: `translateY(-${index * ROW_HEIGHT_PX}px)` }}
        >
          {updates.map((update) => (
            <p
              key={update.message}
              className={cn("flex h-5 items-center text-sm text-white/90")}
            >
              {update.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
