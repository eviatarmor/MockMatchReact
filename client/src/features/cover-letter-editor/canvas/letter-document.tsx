import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  EditableText,
  SectionedBody,
  type BlockTypeMeta,
  type ResolvedStyle,
  type SortableBlockLabels,
} from "@/components/document-editor"
import { resolveContactIcon } from "@/lib/contact-icons"
import { BlockFields } from "./block-fields"
import { LETTER_BLOCK_TYPES } from "../constants"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { CoverLetterDocument, EditorTemplate, LetterBlock } from "../types"

interface LetterDocumentProps {
  readonly document: CoverLetterDocument
  readonly template: EditorTemplate
  /** Resolved visual style (template default + user Style-panel overrides). */
  readonly style: ResolvedStyle
  /** When provided the document is editable; otherwise it renders read-only. */
  readonly handlers?: CoverLetterHandlers
  readonly onAiBlock?: (id: string) => void
  /** Current canvas zoom — used to correct drag math under the CSS transform. */
  readonly scale?: number
}

/** Prose fields hold HTML (Lexical output); render it as such in read-only mode. */
function Html({ html, className }: { readonly html: string; readonly className?: string }) {
  return <div className={cn("whitespace-pre-wrap", className)} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Read-only render of a single body block (previews, export, non-edit mode). */
function ReadOnlyBlock({ block, style }: { readonly block: LetterBlock; readonly style: ResolvedStyle }) {
  switch (block.type) {
    case "greeting":
      return <Html html={block.text} className="font-medium text-neutral-900" />
    case "paragraph":
      return <Html html={block.text} className={cn("text-justify", style.bodyLeading)} />
    case "subject":
      return <p className="font-semibold text-neutral-900">{block.text}</p>
    case "signoff":
      return (
        <div className="flex flex-col gap-4">
          <Html html={block.closing} />
          <p className={cn("text-lg font-semibold text-neutral-900", style.serif && "font-serif")}>{block.signature}</p>
        </div>
      )
    case "custom":
      return (
        <div className="flex flex-col gap-1.5">
          <p className={style.headingClass}>{block.heading}</p>
          <Html html={block.text} className={style.bodyLeading} />
        </div>
      )
  }
}

/** Editable sender + recipient header. */
function DocumentHeader({ document, template, style, handlers }: Required<Pick<LetterDocumentProps, "document" | "template" | "style">> & Pick<LetterDocumentProps, "handlers">) {
  const { t } = useTranslation("cover-letter-editor")
  const { sender, recipient } = document
  const bind = (onChange?: (v: string) => void) => (handlers ? onChange : undefined)

  return (
    <>
      <header className={cn(template.id === "classic" && "text-center")}>
        <EditableText
          value={sender.name}
          onChange={bind((v) => handlers?.setSenderField("name", v))}
          placeholder={t("fields.name")}
          ariaLabel={t("fields.name")}
          className={cn(
            "text-4xl font-bold tracking-tight text-neutral-900",
            template.id === "minimal" && "text-3xl font-semibold uppercase tracking-[0.2em]",
            template.id === "classic" && "text-center"
          )}
        />
        <EditableText
          value={sender.title}
          onChange={bind((v) => handlers?.setSenderField("title", v))}
          placeholder={t("fields.title")}
          ariaLabel={t("fields.title")}
          className={cn("mt-1 text-base font-medium", style.accentText, template.id === "classic" && "text-center")}
        />

        <ul className={cn("mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600", template.id === "classic" && "justify-center")}>
          {sender.contacts.map((contact) => {
            const Icon = resolveContactIcon(contact.iconKey)
            return (
              <li key={contact.id} className="flex items-center gap-1.5">
                <Icon className={cn("size-3.5 shrink-0", style.accentText)} />
                <EditableText
                  value={contact.value}
                  onChange={bind((v) => handlers?.setContact(contact.id, v))}
                  ariaLabel={contact.id}
                />
              </li>
            )
          })}
        </ul>

        <hr className={cn("mt-4 border-t-2", style.accentBorder)} />
      </header>

      <EditableText
        value={document.date}
        onChange={bind((v) => handlers?.setDate(v))}
        ariaLabel={t("fields.date")}
        className="mt-8 text-[15px] text-neutral-500"
      />

      <address className="mt-6 flex flex-col not-italic text-neutral-700">
        <EditableText
          value={recipient.name ?? ""}
          onChange={bind((v) => handlers?.setRecipientField("name", v))}
          placeholder={t("fields.recipientName")}
          ariaLabel={t("fields.recipientName")}
          className="font-medium text-neutral-900"
        />
        <EditableText
          value={recipient.title ?? ""}
          onChange={bind((v) => handlers?.setRecipientField("title", v))}
          placeholder={t("fields.recipientTitle")}
          ariaLabel={t("fields.recipientTitle")}
        />
        <EditableText
          value={recipient.company}
          onChange={bind((v) => handlers?.setRecipientField("company", v))}
          placeholder={t("fields.company")}
          ariaLabel={t("fields.company")}
          className="font-medium text-neutral-900"
        />
        {recipient.addressLines?.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </address>
    </>
  )
}

/** Read-only body block list (previews / export). */
function ReadOnlyBody({ blocks, style }: { readonly blocks: readonly LetterBlock[]; readonly style: ResolvedStyle }) {
  return (
    <div className={cn("flex flex-col", style.sectionGap)}>
      {blocks.map((block) => (
        <ReadOnlyBlock key={block.id} block={block} style={style} />
      ))}
    </div>
  )
}

/** Editable, drag-reorderable body block list with between-block inserters. */
function EditableBody({ blocks, style, handlers, onAiBlock, scale = 1 }: {
  readonly blocks: readonly LetterBlock[]
  readonly style: ResolvedStyle
  readonly handlers: CoverLetterHandlers
  readonly onAiBlock?: (id: string) => void
  readonly scale?: number
}) {
  const { t } = useTranslation("cover-letter-editor")
  const blockLabels: SortableBlockLabels = {
    drag: t("blockToolbar.drag"),
    ai: t("blockToolbar.ai"),
    moveUp: t("blockToolbar.moveUp"),
    moveDown: t("blockToolbar.moveDown"),
    duplicate: t("blockToolbar.duplicate"),
    delete: t("blockToolbar.delete"),
  }

  return (
    <SectionedBody
      blocks={blocks}
      handlers={handlers}
      registry={LETTER_BLOCK_TYPES}
      labelFor={(meta: BlockTypeMeta<LetterBlock>) => t(meta.labelKey)}
      blockLabels={blockLabels}
      addLabel={t("addSection")}
      onAiBlock={onAiBlock}
      scale={scale}
      renderFields={(block) => (
        <BlockFields
          block={block}
          style={style}
          update={(patch) => handlers.updateBlock(block.id, patch)}
        />
      )}
    />
  )
}

/**
 * A4 cover-letter page. Renders a {@link CoverLetterDocument}; pass `handlers`
 * to make every field inline-editable and the body blocks drag-reorderable.
 * Without `handlers` it stays a pure read-only render — reusable for previews,
 * thumbnails, or a future export pipeline. Fixed width (816px ≈ US Letter).
 */
export function LetterDocument({ document, template, style, handlers, onAiBlock, scale }: LetterDocumentProps) {
  return (
    <article
      className={cn(
        "w-[816px] min-h-[1056px] shrink-0 bg-white px-24 py-20 text-neutral-800 shadow-2xl",
        style.fontClass
      )}
    >
      <DocumentHeader document={document} template={template} style={style} handlers={handlers} />

      <div className={cn("mt-6 text-[15px]", style.bodyLeading)}>
        {handlers ? (
          <EditableBody blocks={document.blocks} style={style} handlers={handlers} onAiBlock={onAiBlock} scale={scale} />
        ) : (
          <ReadOnlyBody blocks={document.blocks} style={style} />
        )}
      </div>
    </article>
  )
}
