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
import type {
  CoverLetterDocument,
  EditorTemplate,
  LetterBlock,
  TemplateLayoutId,
} from "../types"

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
  /** Drop page shadow (print / PDF export). */
  readonly print?: boolean
}

type HeaderChildProps = Required<Pick<LetterDocumentProps, "document" | "template" | "style">> &
  Pick<LetterDocumentProps, "handlers">

/** Per-layout header treatments, keyed off `template.layout`. */
const HEADER_STYLE: Record<
  TemplateLayoutId,
  {
    readonly wrap?: string
    readonly name?: string
    readonly title?: string
    readonly contactList?: string
    /** How the header is separated from the body: accent rule, plain rule, or nothing. */
    readonly rule?: "accent" | "plain" | "none"
  }
> = {
  standard: { rule: "accent" },
  centered: {
    wrap: "text-center",
    name: "text-center",
    title: "text-center",
    contactList: "justify-center",
    rule: "accent",
  },
  caps: { name: "text-3xl font-semibold uppercase tracking-[0.2em]", rule: "none" },
  grid: { name: "text-3xl", rule: "plain" },
  executive: { name: "text-5xl", rule: "accent" },
  compact: { name: "text-3xl", rule: "plain" },
  banner: {}, // rendered specially below
  editorial: { name: "text-5xl font-semibold", rule: "accent" },
  elegant: {
    wrap: "text-center",
    name: "text-center uppercase tracking-[0.15em]",
    title: "text-center",
    contactList: "justify-center",
    rule: "accent",
  },
}

/** Editable name + title (shared across every header layout). */
function HeaderIdentity({
  document,
  style,
  handlers,
  nameClass,
  titleClass,
}: HeaderChildProps & { readonly nameClass?: string; readonly titleClass?: string }) {
  const { t } = useTranslation("cover-letter-editor")
  const { sender } = document
  const bind = (onChange?: (v: string) => void) => (handlers ? onChange : undefined)
  const grammarOn = Boolean(handlers)
  const grammarLabels = {
    apply: t("grammar.apply"),
    noSuggestions: t("grammar.noSuggestions"),
    dismiss: t("grammar.dismiss"),
  }
  return (
    <>
      <EditableText
        value={sender.name}
        onChange={bind((v) => handlers?.setSenderField("name", v))}
        placeholder={t("fields.name")}
        ariaLabel={t("fields.name")}
        className={cn("text-4xl font-bold tracking-tight text-neutral-900", nameClass)}
        analysisTarget="sender:name"
      />
      <EditableText
        value={sender.title}
        onChange={bind((v) => handlers?.setSenderField("title", v))}
        placeholder={t("fields.title")}
        ariaLabel={t("fields.title")}
        className={cn("mt-1 text-base font-medium", style.accentText, titleClass)}
        grammar={grammarOn}
        grammarLabels={grammarLabels}
        analysisTarget="sender:title"
      />
    </>
  )
}

/** Editable contact list. Print skips empty contact rows (no orphan icons). */
function HeaderContacts({
  document,
  style,
  handlers,
  className,
}: HeaderChildProps & { readonly className?: string }) {
  const { sender } = document
  const bind = (onChange?: (v: string) => void) => (handlers ? onChange : undefined)
  const allContacts = Array.isArray(sender.contacts) ? sender.contacts : []
  const contacts = handlers ? allContacts : allContacts.filter((c) => c.value.trim())
  if (contacts.length === 0) return null
  return (
    <ul className={cn("mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600", className)}>
      {contacts.map((contact) => {
        const Icon = resolveContactIcon(contact.iconKey)
        return (
          <li key={contact.id} className="flex items-center gap-1.5">
            <Icon className={cn("size-3.5 shrink-0", style.accentText)} />
            <EditableText
              value={contact.value}
              onChange={bind((v) => handlers?.setContact(contact.id, v))}
              ariaLabel={contact.id}
              analysisTarget={`sender:contact:${contact.iconKey}`}
            />
          </li>
        )
      })}
    </ul>
  )
}

/** Editable date + recipient block (shared across layouts). */
function LetterMeta({ document, handlers }: HeaderChildProps) {
  const { t } = useTranslation("cover-letter-editor")
  const { recipient } = document
  const bind = (onChange?: (v: string) => void) => (handlers ? onChange : undefined)
  const grammarOn = Boolean(handlers)
  const grammarLabels = {
    apply: t("grammar.apply"),
    noSuggestions: t("grammar.noSuggestions"),
    dismiss: t("grammar.dismiss"),
  }
  const addressLines = handlers
    ? recipient.addressLines
    : recipient.addressLines?.filter((line) => line.trim())
  const showRecipient =
    Boolean(handlers) ||
    Boolean(recipient.name?.trim()) ||
    Boolean(recipient.title?.trim()) ||
    Boolean(recipient.company.trim()) ||
    Boolean(addressLines && addressLines.length > 0)

  return (
    <>
      <EditableText
        value={document.date}
        onChange={bind((v) => handlers?.setDate(v))}
        ariaLabel={t("fields.date")}
        className="mt-8 text-[15px] text-neutral-500"
        analysisTarget="date"
      />

      {showRecipient ? (
        <address className="mt-6 flex flex-col not-italic text-neutral-700">
          <EditableText
            value={recipient.name ?? ""}
            onChange={bind((v) => handlers?.setRecipientField("name", v))}
            placeholder={t("fields.recipientName")}
            ariaLabel={t("fields.recipientName")}
            className="font-medium text-neutral-900"
            grammar={grammarOn}
            grammarLabels={grammarLabels}
            analysisTarget="recipient:name"
          />
          <EditableText
            value={recipient.title ?? ""}
            onChange={bind((v) => handlers?.setRecipientField("title", v))}
            placeholder={t("fields.recipientTitle")}
            ariaLabel={t("fields.recipientTitle")}
            grammar={grammarOn}
            grammarLabels={grammarLabels}
            analysisTarget="recipient:title"
          />
          <EditableText
            value={recipient.company}
            onChange={bind((v) => handlers?.setRecipientField("company", v))}
            placeholder={t("fields.company")}
            ariaLabel={t("fields.company")}
            className="font-medium text-neutral-900"
            grammar={grammarOn}
            grammarLabels={grammarLabels}
            analysisTarget="recipient:company"
          />
          {addressLines?.map((line, index) => (
            <p key={`${index}-${line}`}>{line}</p>
          ))}
        </address>
      ) : null}
    </>
  )
}

/**
 * Editable header. Switches on `template.layout` to pick a header treatment while
 * keeping the body a single ATS-safe column. Most layouts share one flow (identity
 * → contacts → separator rule); `banner` is structurally distinct.
 */
function DocumentHeader(props: HeaderChildProps) {
  const { template, style } = props
  const layout = template.layout

  if (layout === "banner") {
    return (
      <>
        <header>
          <div className={cn("-mx-24 -mt-20 mb-4 px-24 py-10", style.accentBg)}>
            <HeaderIdentity {...props} nameClass="text-white" titleClass="!text-white/90" />
          </div>
          <HeaderContacts {...props} />
          <hr className={cn("mt-4 border-t-2", style.accentBorder)} />
        </header>
        <LetterMeta {...props} />
      </>
    )
  }

  const s = HEADER_STYLE[layout]
  const rule =
    s.rule === "none" ? null : (
      <hr className={cn("mt-4 border-t-2", s.rule === "plain" ? "border-neutral-300" : style.accentBorder)} />
    )

  return (
    <>
      <header className={s.wrap}>
        <HeaderIdentity {...props} nameClass={s.name} titleClass={s.title} />
        <HeaderContacts {...props} className={s.contactList} />
        {rule}
      </header>
      <LetterMeta {...props} />
    </>
  )
}

/**
 * Read-only body — same fields as the editor via {@link BlockFields}, no chrome.
 * Empty blocks are omitted entirely.
 */
function ReadOnlyBody({ blocks, style }: { readonly blocks: readonly LetterBlock[]; readonly style: ResolvedStyle }) {
  return (
    <div className={cn("flex flex-col", style.sectionGap)}>
      {blocks.map((block) => (
        <BlockFields key={block.id} block={block} style={style} />
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
 * print, and PDF export. Fixed width (816px ≈ US Letter).
 */
export function LetterDocument({
  document,
  template,
  style,
  handlers,
  onAiBlock,
  scale,
  print = false,
}: LetterDocumentProps) {
  return (
    <article
      className={cn(
        "w-[816px] min-h-[1056px] shrink-0 bg-white px-24 py-20 text-neutral-800",
        !print && "shadow-2xl",
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
