import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  EditableText,
  SectionedBody,
  type BlockTypeMeta,
  type SortableBlockLabels,
} from "@/components/document-editor"
import { BlockFields } from "./block-fields"
import { RESUME_SECTION_TYPES } from "../constants"
import { snippet } from "../section-snippet"
import type { ResumeHandlers } from "../hooks/use-resume-document"
import type { EditorTemplate, ResumeDocument, ResumeSection } from "../types"

interface ResumeDocumentProps {
  readonly document: ResumeDocument
  readonly template: EditorTemplate
  /** When provided the document is editable; otherwise it renders read-only. */
  readonly handlers?: ResumeHandlers
  readonly onAiBlock?: (id: string) => void
  /** Current canvas zoom — used to correct drag math under the CSS transform. */
  readonly scale?: number
}

const META = new Map(RESUME_SECTION_TYPES.map((m) => [m.type, m]))

/** Editable name + headline + contacts header. */
function DocumentHeader({ document, template, handlers }: Required<Pick<ResumeDocumentProps, "document" | "template">> & Pick<ResumeDocumentProps, "handlers">) {
  const { t } = useTranslation("resume-editor")
  const { header } = document
  const bind = (onChange?: (v: string) => void) => (handlers ? onChange : undefined)

  return (
    <header className={cn(template.id === "classic" && "text-center")}>
      <EditableText
        value={header.name}
        onChange={bind((v) => handlers?.setHeaderField("name", v))}
        placeholder={t("fields.name")}
        ariaLabel={t("fields.name")}
        className={cn(
          "text-4xl font-bold tracking-tight text-neutral-900",
          template.id === "minimal" && "text-3xl font-semibold uppercase tracking-[0.2em]",
          template.id === "classic" && "text-center"
        )}
      />
      <EditableText
        value={header.headline}
        onChange={bind((v) => handlers?.setHeaderField("headline", v))}
        placeholder={t("fields.headline")}
        ariaLabel={t("fields.headline")}
        className={cn("mt-1 text-base font-medium", template.accentClass, template.id === "classic" && "text-center")}
      />

      <ul className={cn("mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600", template.id === "classic" && "justify-center")}>
        {header.contacts.map((contact) => {
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
  )
}

/** The uppercase section-title label rendered above each section's content. */
function SectionTitle({ section, template }: { readonly section: ResumeSection; readonly template: EditorTemplate }) {
  const { t } = useTranslation("resume-editor")
  const meta = META.get(section.type)
  const label = meta ? t(meta.labelKey) : section.type
  return <p className={cn("mb-1.5 text-sm font-semibold uppercase tracking-wide", template.accentClass)}>{label}</p>
}

/** Read-only render of the sections (previews / export). */
function ReadOnlyBody({ document, template }: { readonly document: ResumeDocument; readonly template: EditorTemplate }) {
  return (
    <div className="flex flex-col gap-5">
      {document.sections.map((section) => (
        <section key={section.id}>
          <SectionTitle section={section} template={template} />
          <p className="text-sm leading-relaxed text-neutral-700">{snippet(section)}</p>
        </section>
      ))}
    </div>
  )
}

/**
 * A4 résumé page. Renders a {@link ResumeDocument}; pass `handlers` to make every
 * field inline-editable and the sections drag-reorderable. Without `handlers` it
 * stays a pure read-only render — reusable for previews, thumbnails, or a future
 * export pipeline. Fixed width (816px ≈ US Letter).
 */
export function ResumeDocumentView({ document, template, handlers, onAiBlock, scale }: ResumeDocumentProps) {
  const { t } = useTranslation("resume-editor")

  const blockLabels: SortableBlockLabels = {
    drag: t("blockToolbar.drag"),
    ai: t("blockToolbar.ai"),
    moveUp: t("blockToolbar.moveUp"),
    moveDown: t("blockToolbar.moveDown"),
    duplicate: t("blockToolbar.duplicate"),
    delete: t("blockToolbar.delete"),
  }

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
          <SectionedBody
            blocks={document.sections}
            handlers={handlers}
            registry={RESUME_SECTION_TYPES}
            labelFor={(meta: BlockTypeMeta<ResumeSection>) => t(meta.labelKey)}
            blockLabels={blockLabels}
            addLabel={t("addSection")}
            onAiBlock={onAiBlock}
            scale={scale}
            renderFields={(section) => (
              <div>
                <SectionTitle section={section} template={template} />
                <BlockFields
                  block={section}
                  template={template}
                  update={(patch) => handlers.updateBlock(section.id, patch)}
                />
              </div>
            )}
          />
        ) : (
          <ReadOnlyBody document={document} template={template} />
        )}
      </div>
    </article>
  )
}
