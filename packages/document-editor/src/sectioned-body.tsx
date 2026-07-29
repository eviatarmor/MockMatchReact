import { Fragment, useMemo, type ReactNode } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { createScaleModifier } from "./dnd"
import { SectionInserter, type InserterItem } from "./section-inserter"
import { SortableBlock, type SortableBlockLabels } from "./sortable-block"
import type { BlockBase, BlockTypeMeta } from "./block-list"
import type { BlockListHandlers } from "./use-block-list"

interface SectionedBodyProps<T extends BlockBase> {
  readonly blocks: readonly T[]
  readonly handlers: BlockListHandlers<T>
  /** Registry → the between-block inserter menu. */
  readonly registry: readonly BlockTypeMeta<T>[]
  /** Translate a registry entry's `labelKey` to a display string. */
  readonly labelFor: (meta: BlockTypeMeta<T>) => string
  /** Toolbar/inserter labels (drag/move/duplicate/delete/ai + add). */
  readonly blockLabels: SortableBlockLabels
  readonly addLabel: string
  /** Render the per-type editable fields for one block. */
  readonly renderFields: (block: T) => ReactNode
  readonly onAiBlock?: (id: string) => void
  /** Current canvas zoom — corrects drag math under the CSS transform. */
  readonly scale?: number
}

/**
 * Editable, drag-reorderable body: a registry-driven list of {@link SortableBlock}
 * chrome with between-block {@link SectionInserter}s. Feature-agnostic — the caller
 * supplies the block union `T`, its registry, and a `renderFields` for the typed
 * editors. Shared by the cover-letter and resume canvases so the DnD/inserter
 * wiring lives in exactly one place.
 */
export function SectionedBody<T extends BlockBase>({
  blocks,
  handlers,
  registry,
  labelFor,
  blockLabels,
  addLabel,
  renderFields,
  onAiBlock,
  scale = 1,
}: SectionedBodyProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const scaleModifier = useMemo(() => createScaleModifier(scale), [scale])

  const inserterItems: InserterItem[] = registry.map((meta) => ({
    id: meta.type,
    icon: meta.icon,
    label: labelFor(meta),
  }))

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) handlers.reorderBlocks(String(active.id), String(over.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[scaleModifier]} onDragEnd={onDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {blocks.map((block, index) => (
            <Fragment key={block.id}>
              <SortableBlock
                id={block.id}
                labels={blockLabels}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
                onAi={onAiBlock ? () => onAiBlock(block.id) : undefined}
                onMoveUp={() => handlers.moveBlock(block.id, "up")}
                onMoveDown={() => handlers.moveBlock(block.id, "down")}
                onDuplicate={() => handlers.duplicateBlock(block.id)}
                onDelete={() => handlers.removeBlock(block.id)}
              >
                {renderFields(block)}
              </SortableBlock>
              <SectionInserter
                items={inserterItems}
                addLabel={addLabel}
                onAdd={(type) => handlers.addBlock(type as T["type"], block.id)}
              />
            </Fragment>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
