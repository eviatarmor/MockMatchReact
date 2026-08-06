import type { ReactNode } from "react"
import { cn } from "@mockmatch/ui/utils"

interface ProductChromeProps {
  readonly title: string
  readonly children: ReactNode
  readonly className?: string
  readonly toolbar?: ReactNode
}

/** Browser / app window chrome around product demos (Attio-style media frame). */
export function ProductChrome({
  title,
  children,
  className,
  toolbar,
}: ProductChromeProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--lp-radius)] border border-[var(--lp-line)] bg-white shadow-[var(--lp-shadow-lg)]",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-[var(--lp-line)] bg-[#fafaf9] px-3.5 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#e5e5e3]" />
          <span className="size-2.5 rounded-full bg-[#e5e5e3]" />
          <span className="size-2.5 rounded-full bg-[#e5e5e3]" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md border border-[var(--lp-line)] bg-white px-3 py-1 text-center text-[0.6875rem] font-medium text-[var(--lp-faint)]">
          {title}
        </div>
        <div className="w-10" aria-hidden />
      </div>
      {toolbar ? (
        <div className="flex items-center gap-2 border-b border-[var(--lp-line)] bg-white px-3 py-2">
          {toolbar}
        </div>
      ) : null}
      <div className="relative bg-[var(--lp-canvas)]">{children}</div>
    </div>
  )
}
