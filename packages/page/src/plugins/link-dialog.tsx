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

  useEffect(() => {
    if (open) setUrl(initialUrl || "https://")
  }, [open, initialUrl])

  const title = labels.linkDialogTitle ?? labels.link
  const description =
    labels.linkDialogDescription ?? labels.linkPrompt
  const urlLabel = labels.linkUrlLabel ?? labels.linkPrompt
  const applyLabel = labels.linkApply ?? "Apply"
  const removeLabel = labels.linkRemove ?? "Remove"
  const cancelLabel = labels.linkCancel ?? "Cancel"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={inputId}>{urlLabel}</Label>
          <Input
            id={inputId}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const trimmed = url.trim()
                if (trimmed) onApply(trimmed)
              }
            }}
          />
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="cursor-pointer"
            onClick={() => {
              onRemove()
              onOpenChange(false)
            }}
          >
            {removeLabel}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              onClick={() => {
                const trimmed = url.trim()
                if (trimmed) onApply(trimmed)
              }}
              disabled={!url.trim()}
            >
              {applyLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
