import { Plus } from "lucide-react"
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
}

export function TemplatePreviewDialog({ template, onOpenChange, translationPrefix }: TemplatePreviewDialogProps) {
  const { t } = useTranslation("common")

  return (
    <Dialog open={template !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {template && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <DialogTitle>{template.title}</DialogTitle>
                <Badge variant="outline">
                  {t(`${translationPrefix}.categories.${template.category}`)}
                </Badge>
              </div>
              <DialogDescription>{template.description}</DialogDescription>
            </DialogHeader>

            <div className="flex aspect-[3/4] max-h-[50vh] w-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
              {template.title}
            </div>

            <DialogFooter>
              <Button className="gap-1.5 cursor-pointer">
                <Plus className="size-4" />
                {t(`${translationPrefix}.useTemplate`)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
