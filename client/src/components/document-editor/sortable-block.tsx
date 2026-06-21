import type { ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { BlockToolbar, type BlockToolbarLabels } from "./block-toolbar"

export interface SortableBlockLabels extends BlockToolbarLabels {
  readonly drag: string
}

interface SortableBlockProps {
  readonly id: string
  readonly canMoveUp: boolean
  readonly canMoveDown: boolean
  readonly onAi?: () => void
  readonly onMoveUp: () => void
  readonly onMoveDown: () => void
  readonly onDuplicate: () => void
  readonly onDelete: () => void
  readonly labels: SortableBlockLabels
  readonly children: ReactNode
}

/**
 * Sortable wrapper around a single document block: grip handle for drag-reorder
 * plus a hover/focus toolbar. Visual chrome only appears on interaction so the
 * page still reads as a clean document. Schema-agnostic — the caller renders the
 * block content as children and owns the mutation handlers.
 */
export function SortableBlock({ id, labels, children, canMoveUp, canMoveDown, ...toolbar }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      // Translate only — never scaleX/scaleY. The vertical sort strategy would
      // otherwise squish the dragged block to match the block it hovers over.
      style={{ transform: transform ? CSS.Translate.toString(transform) : undefined, transition }}
      className={cn(
        "group/block relative rounded-md transition-shadow",
        "hover:ring-1 hover:ring-blue-200 focus-within:ring-1 focus-within:ring-blue-300",
        isDragging && "z-10 bg-white opacity-90 shadow-xl ring-1 ring-blue-300"
      )}
    >
      <button
        type="button"
        aria-label={labels.drag}
        {...attributes}
        {...listeners}
        className="pan-ignore absolute -left-9 top-1/2 flex size-7 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 opacity-0 shadow-sm transition-opacity hover:bg-neutral-100 hover:text-neutral-700 group-hover/block:opacity-100 group-focus-within/block:opacity-100 active:cursor-grabbing dark:border-transparent dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="pointer-events-none absolute -top-3.5 right-2 z-10 opacity-0 transition-opacity group-hover/block:pointer-events-auto group-hover/block:opacity-100 group-focus-within/block:pointer-events-auto group-focus-within/block:opacity-100">
        <BlockToolbar canMoveUp={canMoveUp} canMoveDown={canMoveDown} labels={labels} {...toolbar} />
      </div>

      <div className="px-2 py-1">{children}</div>
    </div>
  )
}
