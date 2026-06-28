import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  EditableText,
  RichTextField,
  type GrammarPopoverLabels,
  type RichTextToolbarLabels,
} from "@/components/document-editor"
import type { EditorTemplate, LetterBlock } from "../types"

interface BlockFieldsProps {
  readonly block: LetterBlock
  readonly template: EditorTemplate
  /** Patch the block in the document store. */
  readonly update: (patch: Partial<LetterBlock>) => void
  /**
   * Color context for the editable text.
   * - `page` (default): dark ink for the white A4 canvas.
   * - `surface`: theme `foreground`, for the mobile sheet (light + dark mode).
   */
  readonly tone?: "page" | "surface"
}

/**
 * The per-type editable fields for a single body block (greeting/subject/
 * paragraph/signoff/custom). Shared between the desktop canvas
 * ({@link LetterBlockView}, wrapped in `SortableBlock` chrome) and the mobile
 * edit sheet, so the field/editor logic lives in exactly one place.
 */
export function BlockFields({ block, template, update, tone = "page" }: BlockFieldsProps) {
  const { t } = useTranslation("cover-letter-editor")
  // On the white page, text is fixed dark ink; on a themed surface it follows
  // the foreground token so it stays legible in light and dark mode.
  const strong = tone === "page" ? "text-neutral-900" : "text-foreground"
  const headingClass = cn("text-sm font-semibold uppercase tracking-wide", template.accentClass)
  const richLabels: RichTextToolbarLabels = {
    bold: t("richText.bold"),
    italic: t("richText.italic"),
    underline: t("richText.underline"),
    list: t("richText.list"),
    link: t("richText.link"),
    clear: t("richText.clear"),
    grammar: t("richText.grammar"),
    linkPrompt: t("richText.linkPrompt"),
  }
  const grammarLabels: GrammarPopoverLabels = {
    apply: t("grammar.apply"),
    noSuggestions: t("grammar.noSuggestions"),
    dismiss: t("grammar.dismiss"),
  }

  if (block.type === "greeting") {
    return (
      <RichTextField
        value={block.text}
        onChange={(text) => update({ text })}
        placeholder={t("blockPlaceholders.greeting")}
        ariaLabel={t("blocks.greeting")}
        className={cn("font-medium", strong)}
        labels={richLabels}
        grammar
        grammarLabels={grammarLabels}
      />
    )
  }

  if (block.type === "paragraph") {
    return (
      <RichTextField
        value={block.text}
        onChange={(text) => update({ text })}
        placeholder={t("blockPlaceholders.paragraph")}
        ariaLabel={t("blocks.paragraph")}
        className="text-justify leading-relaxed"
        labels={richLabels}
        grammar
        grammarLabels={grammarLabels}
      />
    )
  }

  if (block.type === "subject") {
    return (
      <EditableText
        value={block.text}
        onChange={(text) => update({ text })}
        placeholder={t("blockPlaceholders.subject")}
        ariaLabel={t("blocks.subject")}
        className={cn("font-semibold", strong)}
        grammar
        grammarLabels={grammarLabels}
      />
    )
  }

  if (block.type === "signoff") {
    return (
      <div className="flex flex-col gap-4">
        <RichTextField
          value={block.closing}
          onChange={(closing) => update({ closing })}
          placeholder={t("blockPlaceholders.closing")}
          ariaLabel={t("blockPlaceholders.closing")}
          labels={richLabels}
          grammar
          grammarLabels={grammarLabels}
        />
        <EditableText
          value={block.signature}
          onChange={(signature) => update({ signature })}
          placeholder={t("blockPlaceholders.signature")}
          ariaLabel={t("blockPlaceholders.signature")}
          className={cn("text-lg font-semibold", strong, template.serif && "font-serif")}
          grammar
          grammarLabels={grammarLabels}
        />
      </div>
    )
  }

  // custom
  return (
    <div className="flex flex-col gap-1.5">
      <EditableText
        value={block.heading}
        onChange={(heading) => update({ heading })}
        placeholder={t("blockPlaceholders.heading")}
        ariaLabel={t("blockPlaceholders.heading")}
        className={headingClass}
        grammar
        grammarLabels={grammarLabels}
      />
      <RichTextField
        value={block.text}
        onChange={(text) => update({ text })}
        placeholder={t("blockPlaceholders.paragraph")}
        ariaLabel={t("blocks.custom")}
        className="leading-relaxed"
        labels={richLabels}
        grammar
        grammarLabels={grammarLabels}
      />
    </div>
  )
}
