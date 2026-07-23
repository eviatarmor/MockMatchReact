import { useState, type ReactNode } from "react"
import { MoreHorizontal, Eye, Pencil, Download, Copy, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EntityRowActionsProps {
  /** i18n prefix for rowActions + deleteConfirm, e.g. "resumeLab.table" */
  readonly translationPrefix: string
  readonly entityTitle: string
  /** Opens the editor (Edit action). */
  readonly onOpen: () => void
  /**
   * Opens a read-only preview (Preview action). Falls back to {@link onOpen}
   * when omitted so callers without a dedicated preview still work.
   */
  readonly onPreview?: () => void
  readonly onDelete: () => void
  readonly onExport?: () => void
  readonly onDuplicate?: () => void
  readonly isDeleting?: boolean
  readonly isExporting?: boolean
  readonly isDuplicating?: boolean
  /** Extra menu items rendered before export/duplicate (optional). */
  readonly extraItems?: ReactNode
}

/**
 * Shared ⋮ menu + delete confirm for document list rows (resume / cover letter).
 */
export function EntityRowActions({
  translationPrefix,
  entityTitle,
  onOpen,
  onPreview,
  onDelete,
  onExport,
  onDuplicate,
  isDeleting,
  isExporting,
  isDuplicating,
  extraItems,
}: EntityRowActionsProps) {
  const { t } = useTranslation("common")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const key = (suffix: string) => `${translationPrefix}.${suffix}`
  const busy = Boolean(isDeleting || isExporting || isDuplicating)

  return (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              disabled={busy}
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer" onClick={onPreview ?? onOpen}>
            <Eye />
            {t(key("rowActions.preview"))}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={onOpen}>
            <Pencil />
            {t(key("rowActions.edit"))}
          </DropdownMenuItem>
          {extraItems}
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={!onExport || isExporting}
            onClick={onExport}
          >
            <Download />
            {t(key("rowActions.export"))}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={!onDuplicate || isDuplicating}
            onClick={onDuplicate}
          >
            <Copy />
            {t(key("rowActions.duplicate"))}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 />
            {t(key("rowActions.delete"))}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(key("deleteConfirm.title"))}</DialogTitle>
          <DialogDescription>
            {t(key("deleteConfirm.message"), { title: entityTitle })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="cursor-pointer" />}>
            {t(key("deleteConfirm.cancel"))}
          </DialogClose>
          <Button
            variant="destructive"
            className="cursor-pointer"
            disabled={isDeleting}
            onClick={() => {
              setConfirmOpen(false)
              onDelete()
            }}
          >
            {t(key("deleteConfirm.confirm"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
