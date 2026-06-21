import { Fragment, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { EditableText, SectionInserter, createScaleModifier, type InserterItem } from "@/components/document-editor"
import { LetterBlockView } from "./letter-block"
import { LETTER_BLOCK_TYPES } from "../constants"
import type { CoverLetterHandlers } from "../hooks/use-cover-letter-document"
import type { CoverLetterDocument, EditorTemplate, LetterBlock, LetterBlockType } from "../types"

interface LetterDocumentProps {
  readonly document: CoverLetterDocument
  readonly template: EditorTemplate
  /** When provided the document is editable; otherwise it renders read-only. */
  readonly handlers?: CoverLetterHandlers
  readonly onAiBlock?: (id: string) => void
  /** Current canvas zoom — used to correct drag math under the CSS transform. */
  readonly scale?: number
}

/** Read-only render of a single body block (previews, export, non-edit mode). */
function ReadOnlyBlock({ block, template }: { readonly block: LetterBlock; readonly template: EditorTemplate }) {
  switch (block.type) {
    case "greeting":
      return <p className="font-medium text-neutral-900">{block.text}</p>
    case "paragraph":
      return <p className="text-justify leading-relaxed">{block.text}</p>
    case "subject":
      return <p className="font-semibold text-neutral-900">{block.text}</p>
    case "signoff":
      return (
        <div className="flex flex-col gap-4">
          <p>{block.closing}</p>
          <p className={cn("text-lg font-semibold text-neutral-900", template.serif && "font-serif")}>{block.signature}</p>
        </div>
      )
    case "custom":
      return (
        <div className="flex flex-col gap-1.5">
          <p className={cn("text-sm font-semibold uppercase tracking-wide", template.accentClass)}>{block.heading}</p>
          <p className="leading-relaxed">{block.text}</p>
        </div>
      )
  }
}

/** Editable sender + recipient header. */
function DocumentHeader({ document, template, handlers }: Required<Pick<LetterDocumentProps, "document" | "template">> & Pick<LetterDocumentProps, "handlers">) {
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
          className={cn("mt-1 text-base font-medium", template.accentClass, template.id === "classic" && "text-center")}
        />

        <ul className={cn("mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600", template.id === "classic" && "justify-center")}>
          {sender.contacts.map((contact) => {
            const Icon = contact.icon
            return (
              <li key={contact.id} className="flex items-center gap-1.5">
                <Icon className={cn("size-3.5 shrink-0", template.accentClass)} />
                <EditableText
                  value={contact.value}
                  onChange={bind((v) => handlers?.setContact(contact.id, v))}
                  ariaLabel={contact.id}
                />
              </li>
            )
          })}
        </ul>

        <hr className={cn("mt-4 border-t-2", template.id === "modern" ? "border-blue-600" : "border-neutral-300")} />
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
function ReadOnlyBody({ blocks, template }: { readonly blocks: readonly LetterBlock[]; readonly template: EditorTemplate }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => (
        <ReadOnlyBlock key={block.id} block={block} template={template} />
      ))}
    </div>
  )
}

/** Editable, drag-reorderable body block list with between-block inserters. */
function EditableBody({ blocks, template, handlers, onAiBlock, scale = 1 }: {
  readonly blocks: readonly LetterBlock[]
  readonly template: EditorTemplate
  readonly handlers: CoverLetterHandlers
  readonly onAiBlock?: (id: string) => void
  readonly scale?: number
}) {
  const { t } = useTranslation("cover-letter-editor")
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const scaleModifier = useMemo(() => createScaleModifier(scale), [scale])

  const inserterItems: InserterItem[] = LETTER_BLOCK_TYPES.map((meta) => ({
    id: meta.type,
    icon: meta.icon,
    label: t(meta.labelKey),
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
              <LetterBlockView
                block={block}
                template={template}
                index={index}
                total={blocks.length}
                handlers={handlers}
                onAi={onAiBlock}
              />
              <SectionInserter
                items={inserterItems}
                addLabel={t("addSection")}
                onAdd={(type) => handlers.addBlock(type as LetterBlockType, block.id)}
              />
            </Fragment>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

/**
 * A4 cover-letter page. Renders a {@link CoverLetterDocument}; pass `handlers`
 * to make every field inline-editable and the body blocks drag-reorderable.
 * Without `handlers` it stays a pure read-only render — reusable for previews,
 * thumbnails, or a future export pipeline. Fixed width (816px ≈ US Letter).
 */
export function LetterDocument({ document, template, handlers, onAiBlock, scale }: LetterDocumentProps) {
  return (
    <article
      className={cn(
        "w-[816px] min-h-[1056px] shrink-0 bg-white px-24 py-20 text-neutral-800 shadow-2xl",
        template.serif ? "font-serif" : "font-sans"
      )}
    >
      <DocumentHeader document={document} template={template} handlers={handlers} />

      <div className="mt-6 text-[15px] leading-relaxed">
        {handlers ? (
          <EditableBody blocks={document.blocks} template={template} handlers={handlers} onAiBlock={onAiBlock} scale={scale} />
        ) : (
          <ReadOnlyBody blocks={document.blocks} template={template} />
        )}
      </div>
    </article>
  )
}
