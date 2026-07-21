import { Loader2, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { TemplateItem } from "./types"

interface TemplatePreviewDialogProps {
  readonly template: TemplateItem | null
  readonly onOpenChange: (open: boolean) => void
  // i18n key prefix, e.g. "resumeLab.templates"
  readonly translationPrefix: string
  readonly onUse?: (template: TemplateItem) => void
  readonly isUsing?: boolean
}

export function TemplatePreviewDialog({
  template,
  onOpenChange,
  translationPrefix,
  onUse,
  isUsing = false,
}: TemplatePreviewDialogProps) {
  const { t } = useTranslation("common")

  return (
    <Dialog open={template !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {template && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <DialogTitle>{template.title}</DialogTitle>
                <div className="flex gap-1">
                  {template.country ? (
                    <Badge variant="secondary">{template.country}</Badge>
                  ) : null}
                  <Badge variant="outline">
                    {t(`${translationPrefix}.categories.${template.category}`)}
                  </Badge>
                </div>
              </div>
              <DialogDescription>{template.description}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t(`${translationPrefix}.previewTarget`)}
                </p>
                <p className="mt-1 font-medium text-foreground">{template.company}</p>
              </div>
              <p className="text-muted-foreground">{t(`${translationPrefix}.previewHint`)}</p>
            </div>

            <DialogFooter>
              <Button
                className="gap-1.5 cursor-pointer"
                disabled={isUsing || !onUse}
                onClick={() => onUse?.(template)}
                aria-busy={isUsing}
              >
                {isUsing ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                {t(`${translationPrefix}.useTemplate`)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
