import { cn } from "@/lib/utils"

export interface KanbanColumn<TItem> {
  readonly id: string
  readonly label: string
  readonly items: TItem[]
  readonly colorClass?: string
  readonly dotClass?: string
}

interface KanbanBoardProps<TItem> {
  readonly columns: KanbanColumn<TItem>[]
  readonly renderCard: (item: TItem, columnId: string) => React.ReactNode
  readonly keyExtractor: (item: TItem) => string
  readonly className?: string
}

export function KanbanBoard<TItem>({
  columns,
  renderCard,
  keyExtractor,
  className,
}: KanbanBoardProps<TItem>) {
  return (
    <div className={cn("flex h-full gap-3 pb-3", className)}>
      {columns.map((col) => (
        <div key={col.id} className="flex min-w-60 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            {col.dotClass && (
              <span className={cn("size-2 rounded-full", col.dotClass)} />
            )}
            <span className="text-sm font-medium text-foreground">{col.label}</span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {col.items.length}
            </span>
          </div>
          <div
            className={cn(
              "flex flex-1 flex-col gap-2 overflow-y-auto rounded-xl border bg-muted/40 p-2",
              col.colorClass
            )}
          >
            {col.items.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                No items
              </div>
            ) : (
              col.items.map((item) => (
                <div key={keyExtractor(item)}>{renderCard(item, col.id)}</div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
