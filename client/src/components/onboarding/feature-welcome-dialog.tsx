import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FeatureWelcomeDialogProps {
  readonly open: boolean
  readonly onStartTour: () => void
  readonly onSkip: () => void
  readonly icon: LucideIcon
  readonly title: string
  readonly description: string
  readonly tourPrompt: string
  readonly startTourLabel: string
  readonly skipLabel: string
}

export function FeatureWelcomeDialog({
  open,
  onStartTour,
  onSkip,
  icon: Icon,
  title,
  description,
  tourPrompt,
  startTourLabel,
  skipLabel,
}: FeatureWelcomeDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onSkip()
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <div className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Icon className="size-6" aria-hidden />
          </div>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-balance">
            {description}
          </DialogDescription>
        </DialogHeader>

        <p className="text-center text-sm text-muted-foreground">{tourPrompt}</p>

        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={onSkip}
          >
            {skipLabel}
          </Button>
          <Button type="button" className="cursor-pointer" onClick={onStartTour}>
            {startTourLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
