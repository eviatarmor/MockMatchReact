import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"
import type { SpreadsheetSheet } from "./types"

export type SheetTabsProps = {
  readonly sheets: readonly SpreadsheetSheet[]
  readonly activeSheetId: string
  readonly onSelect: (id: string) => void
  readonly onAdd: () => void
  readonly onRename: (id: string, name: string) => void
  readonly onDelete: (id: string) => void
  readonly readOnly?: boolean
  readonly labels: {
    readonly sheetTabsAria: string
    readonly addSheet: string
    readonly renameSheet: string
    readonly deleteSheet: string
    readonly cannotDeleteLastSheet: string
  }
  readonly className?: string
}

export function SheetTabs({
  sheets,
  activeSheetId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  readOnly = false,
  labels,
  className,
}: SheetTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 border-t border-border bg-muted/20 px-1",
        className
      )}
      role="tablist"
      aria-label={labels.sheetTabsAria}
    >
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        {sheets.map((sheet) => {
          const active = sheet.id === activeSheetId
          const editing = editingId === sheet.id
          return (
            <div
              key={sheet.id}
              role="tab"
              aria-selected={active}
              className={cn(
                "group flex h-7 max-w-[10rem] shrink-0 items-center gap-0.5 rounded-md border px-2 text-xs",
                active
                  ? "border-border bg-background text-foreground shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {editing ? (
                <input
                  className="w-20 bg-transparent text-xs outline-none"
                  value={draft}
                  autoFocus
                  aria-label={labels.renameSheet}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    onRename(sheet.id, draft)
                    setEditingId(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onRename(sheet.id, draft)
                      setEditingId(null)
                    }
                    if (e.key === "Escape") setEditingId(null)
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="min-w-0 flex-1 cursor-pointer truncate text-left"
                  onClick={() => onSelect(sheet.id)}
                  onDoubleClick={() => {
                    if (readOnly) return
                    setEditingId(sheet.id)
                    setDraft(sheet.name)
                  }}
                >
                  {sheet.name}
                </button>
              )}
              {!readOnly && sheets.length > 1 ? (
                <button
                  type="button"
                  className="ml-0.5 hidden size-4 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground group-hover:flex"
                  aria-label={labels.deleteSheet}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(sheet.id)
                  }}
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
      {!readOnly ? (
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0 cursor-pointer"
                  aria-label={labels.addSheet}
                  onClick={onAdd}
                />
              }
            >
              <Plus className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">{labels.addSheet}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  )
}
