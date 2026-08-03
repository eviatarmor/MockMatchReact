import { useState } from "react"
import { FileSpreadsheet, Plus, X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@mockmatch/ui/context-menu"
import { Input } from "@mockmatch/ui/input"
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
 * Bottom sheet switcher — same tab chrome as `@mockmatch/ide` {@link IdeTabs}
 * (active bar, close-on-hover, context menu), adapted for sheets.
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

  const canDelete = !readOnly && sheets.length > 1

  const beginRename = (sheet: SpreadsheetSheet) => {
    if (readOnly) return
    setEditingId(sheet.id)
    setDraft(sheet.name)
  }

  const commitRename = (id: string) => {
    onRename(id, draft)
    setEditingId(null)
  }

  return (
    <TooltipProvider delay={300}>
      <div
        className={cn(
          "flex h-9 shrink-0 items-stretch border-t border-border",
          "bg-muted/60 dark:bg-muted/40",
          className
        )}
        data-slot="sheet-tabs-bar"
      >
        <div
          role="tablist"
          aria-label={labels.sheetTabsAria}
          className={cn(
            "flex min-w-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden",
            "[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]",
            "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-0",
            "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          )}
          data-slot="sheet-tabs"
        >
          {sheets.map((sheet) => {
            const active = sheet.id === activeSheetId
            const editing = editingId === sheet.id
            return (
              <ContextMenu key={sheet.id}>
                <ContextMenuTrigger
                  className={cn(
                    "group/tab relative flex h-9 max-w-[14rem] min-w-[7.5rem] shrink-0 items-center border-r border-border/70",
                    active
                      ? "bg-background text-foreground"
                      : "bg-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  )}
                  onAuxClick={(e) => {
                    if (e.button === 1 && canDelete) {
                      e.preventDefault()
                      onDelete(sheet.id)
                    }
                  }}
                >
                  {editing ? (
                    <div className="flex h-full min-w-0 flex-1 items-center gap-1.5 px-2">
                      <FileSpreadsheet className="size-3.5 shrink-0 opacity-70" />
                      <Input
                        className="h-6 min-w-0 flex-1 px-1.5 text-xs"
                        value={draft}
                        autoFocus
                        aria-label={labels.renameSheet}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => commitRename(sheet.id)}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (e.key === "Enter") commitRename(sheet.id)
                          if (e.key === "Escape") setEditingId(null)
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onSelect(sheet.id)}
                        onDoubleClick={() => beginRename(sheet)}
                        className={cn(
                          "flex h-full min-w-0 flex-1 items-center gap-1.5 pl-3 pr-1 text-xs font-medium whitespace-nowrap",
                          "outline-none focus-visible:bg-background/80"
                        )}
                      >
                        <FileSpreadsheet className="size-3.5 shrink-0 opacity-70" />
                        <span className="min-w-0 truncate">{sheet.name}</span>
                      </button>
                      {canDelete ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                className={cn(
                                  "mr-1 flex size-5 shrink-0 items-center justify-center rounded-sm",
                                  "opacity-0 transition-opacity group-hover/tab:opacity-100",
                                  "focus-visible:opacity-100",
                                  active && "opacity-60 hover:opacity-100",
                                  "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                                aria-label={labels.deleteSheet}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(sheet.id)
                                }}
                              />
                            }
                          >
                            <X className="size-3" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {labels.deleteSheet}
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </>
                  )}
                  {active && !editing ? (
                    <span
                      className="absolute inset-x-0 top-0 h-0.5 bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </ContextMenuTrigger>
                <ContextMenuContent className="min-w-48">
                  {!readOnly ? (
                    <ContextMenuItem onClick={() => beginRename(sheet)}>
                      {labels.renameSheet}
                    </ContextMenuItem>
                  ) : null}
                  {canDelete ? (
                    <>
                      {!readOnly ? <ContextMenuSeparator /> : null}
                      <ContextMenuItem onClick={() => onDelete(sheet.id)}>
                        {labels.deleteSheet}
                      </ContextMenuItem>
                    </>
                  ) : null}
                  {!canDelete && !readOnly ? (
                    <ContextMenuItem disabled>
                      {labels.cannotDeleteLastSheet}
                    </ContextMenuItem>
                  ) : null}
                </ContextMenuContent>
              </ContextMenu>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 border-l border-border/70 px-1">
          {!readOnly ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={labels.addSheet}
                    onClick={onAdd}
                  />
                }
              >
                <Plus className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">{labels.addSheet}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  )
}
