interface ReadinessProgressBarProps {
  readonly score: number
  readonly maxScore: number
}

export function ReadinessProgressBar({ score, maxScore }: ReadinessProgressBarProps) {
  const progressPercent = (score / maxScore) * 100

  return (
    <>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-white/80">Your readiness</span>
        <span className="text-2xl font-bold">
          {score}
          <span className="text-base font-normal text-white/60"> / {maxScore}</span>
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-200 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </>
  )
}
