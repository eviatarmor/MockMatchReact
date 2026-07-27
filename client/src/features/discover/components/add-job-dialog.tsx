import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AddJobDialogProps {
  readonly trigger: React.ReactElement
  readonly onAdd: (description: string) => void
}

/** Paste-only job import — description → Saved on the applications board. */
export function AddJobDialog({ trigger, onAdd }: AddJobDialogProps) {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")

  const canSubmit = description.trim().length > 0

  function handleSubmit() {
    if (!canSubmit) return
    onAdd(description.trim())
    setDescription("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="gap-3 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("applications.addJob.title")}</DialogTitle>
          <DialogDescription>{t("applications.addJob.description")}</DialogDescription>
        </DialogHeader>

        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t("applications.addJob.pastePlaceholder")}
          className="min-h-48 resize-none"
          aria-label={t("applications.addJob.pasteLabel")}
        />

        <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
            {t("applications.addJob.cancel")}
          </DialogClose>
          <Button
            className="gap-1.5 cursor-pointer"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Plus className="size-4" />
            {t("applications.addJob.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
