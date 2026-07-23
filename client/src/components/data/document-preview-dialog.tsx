import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DocumentPreviewDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  /** Accessible description (often sr-only). */
  readonly description: string
  readonly children: ReactNode
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
}: DocumentPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,1100px)] w-[min(920px,calc(100%-1.5rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3 pr-12">
          <DialogTitle className="truncate">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
