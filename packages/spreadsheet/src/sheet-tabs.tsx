import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Input } from "@mockmatch/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@mockmatch/ui/tabs"
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

/**
 * Bottom sheet switcher — shadcn {@link Tabs} list + add/delete/rename.
 */
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
        "flex h-11 shrink-0 items-center gap-2 border-t border-border/60 bg-neutral-50/75 px-2 backdrop-blur-md dark:bg-neutral-950/75",
        className
      )}
    >
      <Tabs
        value={activeSheetId}
        onValueChange={onSelect}
        className="min-w-0 flex-1 gap-0"
      >
        <TabsList
          aria-label={labels.sheetTabsAria}
          className="h-8 max-w-full justify-start overflow-x-auto bg-muted"
        >
          {sheets.map((sheet) => {
            const editing = editingId === sheet.id
            return (
              <TabsTrigger
                key={sheet.id}
                value={sheet.id}
                className="group relative max-w-[10rem] cursor-pointer gap-1 px-2.5"
                onDoubleClick={(e) => {
                  if (readOnly) return
                  e.preventDefault()
                  setEditingId(sheet.id)
                  setDraft(sheet.name)
                }}
              >
                {editing ? (
                  <Input
                    className="h-6 w-20 px-1.5 text-xs"
                    value={draft}
                    autoFocus
                    aria-label={labels.renameSheet}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => {
                      onRename(sheet.id, draft)
                      setEditingId(null)
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === "Enter") {
                        onRename(sheet.id, draft)
                        setEditingId(null)
                      }
                      if (e.key === "Escape") setEditingId(null)
                    }}
                  />
                ) : (
                  <span className="truncate">{sheet.name}</span>
                )}
                {!readOnly && sheets.length > 1 && !editing ? (
                  <span
                    role="button"
                    tabIndex={-1}
                    className="ml-0.5 hidden size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground group-hover:inline-flex group-data-active:inline-flex"
                    aria-label={labels.deleteSheet}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onDelete(sheet.id)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <X className="size-3" />
                  </span>
                ) : null}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>
      {!readOnly ? (
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 shrink-0 cursor-pointer"
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
