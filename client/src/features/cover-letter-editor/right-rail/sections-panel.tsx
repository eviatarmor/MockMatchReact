import { useTranslation } from "react-i18next"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { LETTER_BLOCK_TYPES } from "../constants"
import { snippet } from "../section-snippet"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { LetterBlock } from "../types"

interface SectionsPanelProps {
  readonly blocks: readonly LetterBlock[]
  readonly handlers: CoverLetterHandlers
}

const META = new Map(LETTER_BLOCK_TYPES.map((m) => [m.type, m]))

function SectionRow({ block, index, total, handlers }: {
  readonly block: LetterBlock
  readonly index: number
  readonly total: number
  readonly handlers: CoverLetterHandlers
}) {
  const { t } = useTranslation("cover-letter-editor")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const meta = META.get(block.type)
  const Icon = meta?.icon
  const preview = snippet(block).trim()

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 py-2 pl-1.5 pr-2",
        isDragging && "z-10 opacity-80 shadow-md"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t("blockToolbar.drag")}
        className="flex size-5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{meta ? t(meta.labelKey) : block.type}</p>
        {preview && <p className="truncate text-xs text-muted-foreground">{preview}</p>}
      </div>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => handlers.moveBlock(block.id, "up")}
          disabled={index === 0}
          aria-label={t("blockToolbar.moveUp")}
          className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => handlers.moveBlock(block.id, "down")}
          disabled={index === total - 1}
          aria-label={t("blockToolbar.moveDown")}
          className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => handlers.removeBlock(block.id)}
          aria-label={t("blockToolbar.delete")}
          className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  )
}

/** Manage the document's body blocks: drag-reorder, delete, add. */
export function SectionsPanel({ blocks, handlers }: SectionsPanelProps) {
  const { t } = useTranslation("cover-letter-editor")
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) handlers.reorderBlocks(String(active.id), String(over.id))
  }

  return (
    <div className="flex flex-col gap-5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1.5">
            {blocks.map((block, index) => (
              <SectionRow key={block.id} block={block} index={index} total={blocks.length} handlers={handlers} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="flex flex-col gap-2.5 border-t border-border/60 pt-5">
        <Label className="text-sm font-semibold text-foreground">{t("addSection")}</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {LETTER_BLOCK_TYPES.map((meta) => {
            const Icon = meta.icon
            return (
              <button
                key={meta.type}
                type="button"
                onClick={() => handlers.addBlock(meta.type)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border/70 px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
              >
                <Icon className="size-4 shrink-0" />
                {t(meta.labelKey)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
