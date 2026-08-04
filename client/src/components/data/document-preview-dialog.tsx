import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
interface DocumentPreviewDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  /** Accessible description (often sr-only). */
  readonly description: string
  readonly children: ReactNode
  /** Optional footer strip (e.g. restore action on version preview). */
  readonly footer?: ReactNode
  /** When false, description is visible under the title (version history). */
  readonly descriptionSrOnly?: boolean
}

/**
 * Shared large modal shell for résumé / cover-letter table previews.
 * Dialog (not sheet): letter page needs centered width + full-page focus.
 */
export function DocumentPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  descriptionSrOnly = true,
}: DocumentPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(92vh,1100px)] max-h-[min(92vh,1100px)] w-[min(920px,calc(100%-1.5rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3 pr-12">
          <DialogTitle className="truncate text-base font-medium">{title}</DialogTitle>
          <DialogDescription
            className={
              descriptionSrOnly
                ? "sr-only"
                : "text-2xs text-muted-foreground"
            }
          >
            {description}
          </DialogDescription>
        </DialogHeader>
        {/*
          h-0 + flex-1: force a bounded height so overflow-y-auto actually scrolls
          (flex-1 alone lets the root grow with content → no scroll).
        */}
        <div className="h-0 min-h-0 w-full flex-1 overflow-y-auto">
          {children}
        </div>
        {footer != null && (
          <div className="shrink-0 border-t border-border/60 px-4 py-3">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
