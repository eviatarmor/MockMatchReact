import type { ReadinessUpdate } from "@/lib/login/types"

const ROW_HEIGHT_PX = 20

interface ReadinessMessageTickerProps {
  readonly updates: readonly ReadinessUpdate[]
  readonly index: number
}

export function ReadinessMessageTicker({ updates, index }: ReadinessMessageTickerProps) {
  return (
    <div className="mt-3 h-5 overflow-hidden">
      <div
        className="transition-transform duration-500 ease-in-out"
        style={{ transform: `translateY(-${index * ROW_HEIGHT_PX}px)` }}
      >
        {updates.map((update) => (
          <p key={update.message} className="flex h-5 items-center text-sm text-white/90">
            {update.message}
          </p>
        ))}
      </div>
    </div>
  )
}
