import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { EntityRowActions } from "@/components/data/entity-row-actions"
import { ScaledDocumentFrame } from "@/components/data/scaled-document-frame"
import { StaggerItem } from "@mockmatch/ui/stagger"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { scoreBand, type ScoreBand } from "@/lib/score-tier"
import { cn } from "@/lib/utils"

type DocumentStatus = "active" | "draft" | "archived"

interface DocumentThumbnailCardProps {
  readonly title: string
  readonly subtitle: string
  readonly score: number | null
  readonly status: DocumentStatus
  readonly updatedAt: string
  /** i18n prefix for rowActions + deleteConfirm, e.g. "resumeLab.table" */
  readonly translationPrefix: string
  /** i18n prefix for status labels, e.g. "resumeLab.table.statusLabels" */
  readonly statusTranslationPrefix: string
  /** Scaled print-page preview content. */
  readonly document: ReactNode
  readonly index: number
  readonly onOpen: () => void
  readonly onPreview: () => void
  readonly onDelete: () => void
  readonly onExport: () => void
  readonly onDuplicate: () => void
  readonly isDeleting?: boolean
  readonly isExporting?: boolean
  readonly isDuplicating?: boolean
  readonly className?: string
}

const SCORE_TEXT: Record<ScoreBand, string> = {
  strong: "text-emerald-700",
  ok: "text-amber-800",
  weak: "text-rose-700",
}

/**
 * Static overlay pills — plain spans, no Badge/hover/transition so colour
 * never shifts under the card hover scrim.
 */
function OverlayPill({
  children,
  className,
  title,
}: {
  readonly children: ReactNode
  readonly className?: string
  readonly title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-5 shrink-0 items-center justify-center rounded-full border px-2 text-xs font-medium tabular-nums",
        className
      )}
    >
      {children}
    </span>
  )
}

function OverlayScorePill({ score }: { readonly score: number | null }) {
  if (score === null) {
    return (
      <OverlayPill className="border-white/25 bg-white/15 text-white" title="Not scored yet">
        —
      </OverlayPill>
    )
  }

  const band = scoreBand(score)
  return (
    <OverlayPill
      className={cn("border-black/10 bg-white shadow-sm", SCORE_TEXT[band])}
      title={`${band} · ${score}`}
    >
      {score}
    </OverlayPill>
  )
}

function OverlayStatusPill({
  status,
  translationPrefix,
}: {
  readonly status: DocumentStatus
  readonly translationPrefix: string
}) {
  const { t } = useTranslation("common")

  return (
    <OverlayPill
      className={
        status === "active"
          ? "border-transparent bg-white text-neutral-900 shadow-sm"
          : "border-white/30 bg-white/15 text-white"
      }
    >
      {t(`${translationPrefix}.${status}`)}
    </OverlayPill>
  )
}

/**
 * Grid tile: full-bleed print thumbnail. Hover darkens bottom → top and reveals
 * table meta + bottom-right row actions.
 */
export function DocumentThumbnailCard({
  title,
  subtitle,
  score,
  status,
  updatedAt,
  translationPrefix,
  statusTranslationPrefix,
  document,
  index,
  onOpen,
  onPreview,
  onDelete,
  onExport,
  onDuplicate,
  isDeleting,
  isExporting,
  isDuplicating,
  className,
}: DocumentThumbnailCardProps) {
  return (
    <StaggerItem index={index} direction="up" className={cn("w-full", className)}>
      <div className="group relative w-full overflow-hidden rounded-xl">
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={title}
        />

        <ScaledDocumentFrame>{document}</ScaledDocumentFrame>

        {/* Bottom-heavy hover scrim — meta only near the dark edge. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-20 flex flex-col justify-end",
            "bg-gradient-to-t from-black/90 via-black/55 via-40% to-transparent",
            "opacity-0 transition-opacity duration-200",
            "group-hover:opacity-100 group-focus-within:opacity-100"
          )}
        >
          <div className="flex items-end gap-2 p-3">
            <div className="min-w-0 flex-1 space-y-2 text-left">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white drop-shadow-sm">
                  {title}
                </p>
                <p className="truncate text-xs text-white/80 drop-shadow-sm">{subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <OverlayScorePill score={score} />
                <OverlayStatusPill
                  status={status}
                  translationPrefix={statusTranslationPrefix}
                />
                <span className="text-[11px] text-white/75 drop-shadow-sm">
                  {formatRelativeTime(updatedAt)}
                </span>
              </div>
            </div>

            <div
              className={cn(
                "pointer-events-none shrink-0 self-end",
                "group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
              )}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <EntityRowActions
                translationPrefix={translationPrefix}
                entityTitle={title}
                onOpen={onOpen}
                onPreview={onPreview}
                onDelete={onDelete}
                onExport={onExport}
                onDuplicate={onDuplicate}
                isDeleting={isDeleting}
                isExporting={isExporting}
                isDuplicating={isDuplicating}
                triggerClassName="text-white hover:bg-white/15 hover:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </StaggerItem>
  )
}
