import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { isBlankHtml } from "@/lib/blank-html"
import {
  EditableText,
  RichTextField,
  type GrammarPopoverLabels,
  type ResolvedStyle,
  type RichTextToolbarLabels,
} from "@/components/document-editor"
import type {
  CustomBlock,
  GreetingBlock,
  LetterBlock,
  ParagraphBlock,
  SignoffBlock,
  SubjectBlock,
} from "../types"

interface BlockFieldsProps {
  readonly block: LetterBlock
  readonly style: ResolvedStyle
  /**
   * Patch the block in the document store. When omitted the fields render
   * read-only (print / export) — no placeholders or grammar.
   */
  readonly update?: (patch: Partial<LetterBlock>) => void
  /**
   * Color context for the editable text.
   * - `page` (default): dark ink for the white A4 canvas.
   * - `surface`: theme `foreground`, for the mobile sheet (light + dark mode).
   */
  readonly tone?: "page" | "surface"
}

type FieldCtx = {
  readonly editable: boolean
  readonly strong: string
  readonly headingClass: string
  readonly serif: boolean
  readonly richLabels: RichTextToolbarLabels
  readonly grammarLabels: GrammarPopoverLabels
  readonly t: (key: string) => string
  readonly update?: (patch: Partial<LetterBlock>) => void
}

function letterBlockIsEmpty(block: LetterBlock): boolean {
  switch (block.type) {
    case "greeting":
    case "paragraph":
      return isBlankHtml(block.text)
    case "subject":
      return !block.text.trim()
    case "signoff":
      return isBlankHtml(block.closing) && !block.signature.trim()
    case "custom":
      return !block.heading.trim() && isBlankHtml(block.text)
  }
}

function useFieldCtx(
  style: ResolvedStyle,
  update: BlockFieldsProps["update"],
  tone: "page" | "surface"
): FieldCtx {
  const { t } = useTranslation("cover-letter-editor")
  return {
    editable: typeof update === "function",
    strong: tone === "page" ? "text-neutral-900" : "text-foreground",
    headingClass: style.headingClass,
    serif: Boolean(style.serif),
    update,
    t,
    richLabels: {
      bold: t("richText.bold"),
      italic: t("richText.italic"),
      underline: t("richText.underline"),
      list: t("richText.list"),
      link: t("richText.link"),
      clear: t("richText.clear"),
      linkPrompt: t("richText.linkPrompt"),
    },
    grammarLabels: {
      apply: t("grammar.apply"),
      noSuggestions: t("grammar.noSuggestions"),
      dismiss: t("grammar.dismiss"),
    },
  }
}

function GreetingFields({ block, ctx }: { readonly block: GreetingBlock; readonly ctx: FieldCtx }) {
  return (
    <RichTextField
      value={block.text}
      onChange={ctx.editable ? (text) => ctx.update?.({ text }) : undefined}
      placeholder={ctx.editable ? ctx.t("blockPlaceholders.greeting") : undefined}
      ariaLabel={ctx.t("blocks.greeting")}
      className={cn("font-medium", ctx.strong)}
      labels={ctx.richLabels}
      grammar={ctx.editable}
      grammarLabels={ctx.grammarLabels}
    />
  )
}

function ParagraphFields({ block, ctx }: { readonly block: ParagraphBlock; readonly ctx: FieldCtx }) {
  return (
    <RichTextField
      value={block.text}
      onChange={ctx.editable ? (text) => ctx.update?.({ text }) : undefined}
      placeholder={ctx.editable ? ctx.t("blockPlaceholders.paragraph") : undefined}
      ariaLabel={ctx.t("blocks.paragraph")}
      className="text-justify leading-relaxed"
      labels={ctx.richLabels}
      grammar={ctx.editable}
      grammarLabels={ctx.grammarLabels}
    />
  )
}

function SubjectFields({ block, ctx }: { readonly block: SubjectBlock; readonly ctx: FieldCtx }) {
  return (
    <EditableText
      value={block.text}
      onChange={ctx.editable ? (text) => ctx.update?.({ text }) : undefined}
      placeholder={ctx.editable ? ctx.t("blockPlaceholders.subject") : undefined}
      ariaLabel={ctx.t("blocks.subject")}
      className={cn("font-semibold", ctx.strong)}
      grammar={ctx.editable}
      grammarLabels={ctx.grammarLabels}
    />
  )
}

function SignoffFields({ block, ctx }: { readonly block: SignoffBlock; readonly ctx: FieldCtx }) {
  return (
    <div className="flex flex-col gap-4">
      <RichTextField
        value={block.closing}
        onChange={ctx.editable ? (closing) => ctx.update?.({ closing }) : undefined}
        placeholder={ctx.editable ? ctx.t("blockPlaceholders.closing") : undefined}
        ariaLabel={ctx.t("blockPlaceholders.closing")}
        labels={ctx.richLabels}
        grammar={ctx.editable}
        grammarLabels={ctx.grammarLabels}
      />
      <EditableText
        value={block.signature}
        onChange={ctx.editable ? (signature) => ctx.update?.({ signature }) : undefined}
        placeholder={ctx.editable ? ctx.t("blockPlaceholders.signature") : undefined}
        ariaLabel={ctx.t("blockPlaceholders.signature")}
        className={cn("text-lg font-semibold", ctx.strong, ctx.serif && "font-serif")}
        grammar={ctx.editable}
        grammarLabels={ctx.grammarLabels}
      />
    </div>
  )
}

function CustomFields({ block, ctx }: { readonly block: CustomBlock; readonly ctx: FieldCtx }) {
  return (
    <div className="flex flex-col gap-1.5">
      <EditableText
        value={block.heading}
        onChange={ctx.editable ? (heading) => ctx.update?.({ heading }) : undefined}
        placeholder={ctx.editable ? ctx.t("blockPlaceholders.heading") : undefined}
        ariaLabel={ctx.t("blockPlaceholders.heading")}
        className={ctx.headingClass}
        grammar={ctx.editable}
        grammarLabels={ctx.grammarLabels}
      />
      <RichTextField
        value={block.text}
        onChange={ctx.editable ? (text) => ctx.update?.({ text }) : undefined}
        placeholder={ctx.editable ? ctx.t("blockPlaceholders.paragraph") : undefined}
        ariaLabel={ctx.t("blocks.custom")}
        className="leading-relaxed"
        labels={ctx.richLabels}
        grammar={ctx.editable}
        grammarLabels={ctx.grammarLabels}
      />
    </div>
  )
}

/**
 * The per-type editable fields for a single body block (greeting/subject/
 * paragraph/signoff/custom). Shared between the desktop canvas (wrapped in
 * `SortableBlock` chrome by `SectionedBody`) and the mobile edit sheet, so the
 * field/editor logic lives in exactly one place. Without `update` it is also
 * the print/export path (1:1 with the editor, empty fields omitted).
 */
export function BlockFields({ block, style, update, tone = "page" }: BlockFieldsProps) {
  const ctx = useFieldCtx(style, update, tone)
  if (!ctx.editable && letterBlockIsEmpty(block)) return null

  switch (block.type) {
    case "greeting":
      return <GreetingFields block={block} ctx={ctx} />
    case "paragraph":
      return <ParagraphFields block={block} ctx={ctx} />
    case "subject":
      return <SubjectFields block={block} ctx={ctx} />
    case "signoff":
      return <SignoffFields block={block} ctx={ctx} />
    case "custom":
      return <CustomFields block={block} ctx={ctx} />
  }
}
