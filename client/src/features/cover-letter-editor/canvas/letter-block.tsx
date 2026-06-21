import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { EditableText } from "./editable-text"
import { BlockFrame } from "./block-frame"
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
  const headingClass = cn("text-sm font-semibold uppercase tracking-wide", template.accentClass)

  return (
    <BlockFrame
      id={block.id}
      canMoveUp={index > 0}
      canMoveDown={index < total - 1}
      onAi={onAi ? () => onAi(block.id) : undefined}
      onMoveUp={() => handlers.moveBlock(block.id, "up")}
      onMoveDown={() => handlers.moveBlock(block.id, "down")}
      onDuplicate={() => handlers.duplicateBlock(block.id)}
      onDelete={() => handlers.removeBlock(block.id)}
    >
      {block.type === "greeting" && (
        <EditableText
          multiline
          value={block.text}
          onChange={(text) => update({ text })}
          placeholder={t("blockPlaceholders.greeting")}
          ariaLabel={t("blocks.greeting")}
          className="font-medium text-neutral-900"
        />
      )}

      {block.type === "paragraph" && (
        <EditableText
          multiline
          value={block.text}
          onChange={(text) => update({ text })}
          placeholder={t("blockPlaceholders.paragraph")}
          ariaLabel={t("blocks.paragraph")}
          className="text-justify leading-relaxed"
        />
      )}

      {block.type === "subject" && (
        <EditableText
          value={block.text}
          onChange={(text) => update({ text })}
          placeholder={t("blockPlaceholders.subject")}
          ariaLabel={t("blocks.subject")}
          className="font-semibold text-neutral-900"
        />
      )}

      {block.type === "signoff" && (
        <div className="flex flex-col gap-4">
          <EditableText
            multiline
            value={block.closing}
            onChange={(closing) => update({ closing })}
            placeholder={t("blockPlaceholders.closing")}
            ariaLabel={t("blockPlaceholders.closing")}
          />
          <EditableText
            value={block.signature}
            onChange={(signature) => update({ signature })}
            placeholder={t("blockPlaceholders.signature")}
            ariaLabel={t("blockPlaceholders.signature")}
            className={cn("text-lg font-semibold text-neutral-900", template.serif && "font-serif")}
          />
        </div>
      )}

      {block.type === "custom" && (
        <div className="flex flex-col gap-1.5">
          <EditableText
            value={block.heading}
            onChange={(heading) => update({ heading })}
            placeholder={t("blockPlaceholders.heading")}
            ariaLabel={t("blockPlaceholders.heading")}
            className={headingClass}
          />
          <EditableText
            multiline
            value={block.text}
            onChange={(text) => update({ text })}
            placeholder={t("blockPlaceholders.paragraph")}
            ariaLabel={t("blocks.custom")}
            className="leading-relaxed"
          />
        </div>
      )}
    </BlockFrame>
  )
}
