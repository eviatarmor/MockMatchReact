import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@mockmatch/ui/utils"

/** Lock drag transform to the Y axis (no horizontal drift). */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
})

export type McqOrderListProps = {
  readonly options: readonly string[]
  /** Current display order as original option indices */
  readonly orderedIndices: readonly number[]
  readonly onReorder: (next: number[]) => void
  readonly disabled?: boolean
  /** When revealed, highlight positions that match correctOrder */
  readonly revealed?: boolean
  readonly correctOrder?: readonly number[] | null
  readonly dragAriaLabel: string
}

function SortableRow({
  id,
  text,
  position,
  disabled,
  dragAriaLabel,
  tone,
}: {
  readonly id: string
  readonly text: string
  readonly position: number
  readonly disabled?: boolean
  readonly dragAriaLabel: string
  readonly tone?: "correct" | "wrong" | "neutral"
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled })

  // Also zero x here so sorted items never slide sideways mid-drag.
  const locked = transform == null ? null : { ...transform, x: 0 }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(locked), transition }}
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border bg-card px-2 py-2.5",
        isDragging && "z-10 opacity-90 shadow-md",
        tone === "correct" && "border-emerald-500/60 bg-emerald-500/10",
        tone === "wrong" && "border-destructive/60 bg-destructive/10"
      )}
    >
      <button
        type="button"
        className={cn(
          "mt-0.5 flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground",
          "hover:bg-muted hover:text-foreground active:cursor-grabbing",
          disabled && "pointer-events-none opacity-40"
        )}
        aria-label={dragAriaLabel}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums">
        {position}
      </span>
      <span className="min-w-0 flex-1 pt-0.5 text-sm leading-snug">{text}</span>
    </li>
  )
}

export function McqOrderList({
  options,
  orderedIndices,
  onReorder,
  disabled,
  revealed,
  correctOrder,
  dragAriaLabel,
}: McqOrderListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )
  const ids = orderedIndices.map((i) => `opt-${i}`)

  const onDragEnd = (event: DragEndEvent) => {
    if (disabled) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove([...orderedIndices], oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {orderedIndices.map((optIndex, pos) => {
            let tone: "correct" | "wrong" | "neutral" = "neutral"
            if (revealed && correctOrder) {
              tone = correctOrder[pos] === optIndex ? "correct" : "wrong"
            }
            return (
              <SortableRow
                key={`opt-${optIndex}`}
                id={`opt-${optIndex}`}
                text={options[optIndex] ?? ""}
                position={pos + 1}
                disabled={disabled}
                dragAriaLabel={dragAriaLabel}
                tone={tone}
              />
            )
          })}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
