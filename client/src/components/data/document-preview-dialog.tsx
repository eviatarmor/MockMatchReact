import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
import { ScrollArea } from "@mockmatch/ui/scroll-area"

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
          <DialogTitle className="truncate">{title}</DialogTitle>
          <DialogDescription
            className={
              descriptionSrOnly
                ? "sr-only"
                : "text-xs text-muted-foreground"
            }
          >
            {description}
          </DialogDescription>
        </DialogHeader>
        {/*
          h-0 + flex-1: force a bounded height so ScrollArea's size-full viewport
          actually overflows (flex-1 alone lets the root grow with content → no scroll).
        */}
        <ScrollArea className="h-0 min-h-0 w-full flex-1">
          {children}
        </ScrollArea>
        {footer != null && (
          <div className="shrink-0 border-t border-border/60 px-4 py-3">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
