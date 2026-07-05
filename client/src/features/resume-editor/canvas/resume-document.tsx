import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  EditableText,
  SectionedBody,
  type BlockTypeMeta,
  type ResolvedStyle,
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
  /** Resolved visual style (template default + user Style-panel overrides). */
  readonly style: ResolvedStyle
  /** When provided the document is editable; otherwise it renders read-only. */
  readonly handlers?: ResumeHandlers
  readonly onAiBlock?: (id: string) => void
  /** Current canvas zoom — used to correct drag math under the CSS transform. */
  readonly scale?: number
}

const META = new Map(RESUME_SECTION_TYPES.map((m) => [m.type, m]))

/** Editable name + headline + contacts header. */
function DocumentHeader({ document, template, style, handlers }: Required<Pick<ResumeDocumentProps, "document" | "template" | "style">> & Pick<ResumeDocumentProps, "handlers">) {
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
        className={cn("mt-1 text-base font-medium", style.accentText, template.id === "classic" && "text-center")}
      />

      <ul className={cn("mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600", template.id === "classic" && "justify-center")}>
        {header.contacts.map((contact) => {
          const Icon = contact.icon
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
  )
}

/** The section-title label rendered above each section's content. */
function SectionTitle({ section, style }: { readonly section: ResumeSection; readonly style: ResolvedStyle }) {
  const { t } = useTranslation("resume-editor")
  const meta = META.get(section.type)
  const label = meta ? t(meta.labelKey) : section.type
  return <p className={cn("mb-1.5", style.headingClass)}>{label}</p>
}

/** Read-only render of the sections (previews / export). */
function ReadOnlyBody({ document, style }: { readonly document: ResumeDocument; readonly style: ResolvedStyle }) {
  return (
    <div className={cn("flex flex-col", style.sectionGap)}>
      {document.sections.map((section) => (
        <section key={section.id}>
          <SectionTitle section={section} style={style} />
          <p className={cn("text-sm text-neutral-700", style.bodyLeading)}>{snippet(section)}</p>
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
export function ResumeDocumentView({ document, template, style, handlers, onAiBlock, scale }: ResumeDocumentProps) {
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
        style.fontClass
      )}
    >
      <DocumentHeader document={document} template={template} style={style} handlers={handlers} />

      <div className={cn("mt-6 text-[15px]", style.bodyLeading)}>
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
                <SectionTitle section={section} style={style} />
                <BlockFields
                  block={section}
                  style={style}
                  update={(patch) => handlers.updateBlock(section.id, patch)}
                />
              </div>
            )}
          />
        ) : (
          <ReadOnlyBody document={document} style={style} />
        )}
      </div>
    </article>
  )
}
