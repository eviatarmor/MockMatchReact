import { useEffect, useId, useState } from "react"
import { Button } from "@mockmatch/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
import { Input } from "@mockmatch/ui/input"
import { Label } from "@mockmatch/ui/label"
import type { PageEditorLabels } from "../types"
import {
  canApplyLinkUrl,
  linkUrlForOpen,
  resolveLinkDialogLabels,
  trimmedLinkUrl,
} from "./link-dialog-labels"

export type LinkDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly initialUrl: string
  readonly labels: PageEditorLabels
  readonly onApply: (url: string) => void
  readonly onRemove: () => void
}

/**
 * shadcn Dialog + Input for insert/edit link (replaces window.prompt).
 */
export function LinkDialog({
  open,
  onOpenChange,
  initialUrl,
  labels,
  onApply,
  onRemove,
}: LinkDialogProps) {
  const inputId = useId()
  const [url, setUrl] = useState(initialUrl)
  const dialogLabels = resolveLinkDialogLabels(labels)
  const canApply = canApplyLinkUrl(url)

  useEffect(() => {
    if (!open) return
    setUrl(linkUrlForOpen(initialUrl))
  }, [open, initialUrl])

  const submit = () => {
    if (!canApply) return
    onApply(trimmedLinkUrl(url))
  }

  const removeAndClose = () => {
    onRemove()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{dialogLabels.title}</DialogTitle>
          <DialogDescription>{dialogLabels.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={inputId}>{dialogLabels.urlLabel}</Label>
          <Input
            id={inputId}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            autoFocus
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              e.preventDefault()
              submit()
            }}
          />
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="cursor-pointer"
            onClick={removeAndClose}
          >
            {dialogLabels.removeLabel}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              {dialogLabels.cancelLabel}
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={submit}
              disabled={!canApply}
            >
              {dialogLabels.applyLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
