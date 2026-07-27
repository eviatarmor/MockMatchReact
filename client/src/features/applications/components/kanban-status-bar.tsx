import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { SECONDARY_BAR_SURFACE_STUCK } from "@/components/document-editor"
import { cn } from "@/lib/utils"
import { STATUS_DOT_CLASS, TRACKING_STATUS_ORDER } from "../constants"
import type { TrackingStatus } from "../types"

interface KanbanStatusBarProps {
  readonly counts: Readonly<Record<TrackingStatus, number>>
  readonly className?: string
}

/**
 * Sticky secondary chrome under the main dashboard navbar.
 * Rest: shell bg, no border. Pinned: shared translucent stuck surface + border.
 */
export function KanbanStatusBar({ counts, className }: KanbanStatusBarProps) {
  const { t } = useTranslation("common")
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const root =
      sentinel.closest('[data-slot="scroll-area-viewport"]') ?? null

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStuck(!entry.isIntersecting)
      },
      { root, threshold: 0, rootMargin: "0px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden />
      <div
        className={cn(
          // Border only when stuck — same moment the translucent surface kicks in.
          "sticky top-0 z-20 -mx-6 flex h-11 shrink-0 items-center border-b px-6 transition-[background-color,backdrop-filter,border-color] duration-150",
          stuck
            ? SECONDARY_BAR_SURFACE_STUCK
            : "border-transparent bg-neutral-50 dark:bg-neutral-950",
          className
        )}
        role="navigation"
        aria-label={t("applications.title")}
        data-stuck={stuck ? "true" : "false"}
      >
        <div className="flex w-full min-w-0 items-center gap-3">
          {TRACKING_STATUS_ORDER.map((status) => (
            <div
              key={status}
              className="flex min-w-0 flex-1 items-center gap-2 px-1"
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  STATUS_DOT_CLASS[status]
                )}
                aria-hidden
              />
              <span className="truncate text-sm font-medium text-foreground">
                {t(`applications.statusLabels.${status}`)}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {counts[status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
