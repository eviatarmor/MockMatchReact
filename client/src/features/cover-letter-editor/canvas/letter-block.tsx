import { useTranslation } from "react-i18next"
import { SortableBlock, type SortableBlockLabels } from "@/components/document-editor"
import { BlockFields } from "./block-fields"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { EditorTemplate, LetterBlock } from "../types"

interface LetterBlockViewProps {
  readonly block: LetterBlock
  readonly template: EditorTemplate
  readonly index: number
  readonly total: number
  readonly handlers: CoverLetterHandlers
  readonly onAi?: (id: string) => void
}

/** Edit-mode renderer for a single body block (greeting/paragraph/subject/signoff/custom). */
export function LetterBlockView({ block, template, index, total, handlers, onAi }: LetterBlockViewProps) {
  const { t } = useTranslation("cover-letter-editor")
  const update = (patch: Partial<LetterBlock>) => handlers.updateBlock(block.id, patch)
  const labels: SortableBlockLabels = {
    drag: t("blockToolbar.drag"),
    ai: t("blockToolbar.ai"),
    moveUp: t("blockToolbar.moveUp"),
    moveDown: t("blockToolbar.moveDown"),
    duplicate: t("blockToolbar.duplicate"),
    delete: t("blockToolbar.delete"),
  }

  return (
    <SortableBlock
      id={block.id}
      labels={labels}
      canMoveUp={index > 0}
      canMoveDown={index < total - 1}
      onAi={onAi ? () => onAi(block.id) : undefined}
      onMoveUp={() => handlers.moveBlock(block.id, "up")}
      onMoveDown={() => handlers.moveBlock(block.id, "down")}
      onDuplicate={() => handlers.duplicateBlock(block.id)}
      onDelete={() => handlers.removeBlock(block.id)}
    >
      <BlockFields block={block} template={template} update={update} />
    </SortableBlock>
  )
}
