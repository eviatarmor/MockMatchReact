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
import { resolveContactIcon } from "@/lib/contact-icons"
import { RESUME_SECTION_TYPES } from "../constants"
import { sectionIsEmpty } from "../section-snippet"
import type { ResumeHandlers } from "../hooks/use-resume-document"
import type { EditorTemplate, ResumeDocument, ResumeSection, TemplateLayoutId } from "../types"

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
  /** Drop page shadow (print / PDF export). */
  readonly print?: boolean
}

const META = new Map(RESUME_SECTION_TYPES.map((m) => [m.type, m]))

type HeaderChildProps = Required<Pick<ResumeDocumentProps, "document" | "template" | "style">> &
  Pick<ResumeDocumentProps, "handlers">

/** Per-layout header treatments, keyed off `template.layout`. */
const HEADER_STYLE: Record<
  TemplateLayoutId,
  {
    readonly wrap?: string
    readonly name?: string
    readonly headline?: string
    readonly contactList?: string
    /** How the header is separated from the body: accent rule, plain rule, or nothing. */
    readonly rule?: "accent" | "plain" | "none"
  }
> = {
  standard: { rule: "accent" },
  centered: { wrap: "text-center", name: "text-center", headline: "text-center", contactList: "justify-center", rule: "accent" },
  caps: { name: "text-3xl font-semibold uppercase tracking-[0.2em]", rule: "none" },
  grid: { name: "text-3xl", rule: "plain" },
  executive: { name: "text-5xl", rule: "accent" },
  compact: { name: "text-3xl", rule: "plain" },
  banner: {}, // rendered specially below
  editorial: { name: "text-5xl font-semibold", rule: "accent" },
  elegant: { wrap: "text-center", name: "text-center uppercase tracking-[0.15em]", headline: "text-center", contactList: "justify-center", rule: "accent" },
}

/** Editable name + headline (shared across every header layout). */
function HeaderIdentity({ document, style, handlers, nameClass, headlineClass }: HeaderChildProps & { readonly nameClass?: string; readonly headlineClass?: string }) {
  const { t } = useTranslation("resume-editor")
  const { header } = document
  const bind = (onChange?: (v: string) => void) => (handlers ? onChange : undefined)
  const grammarLabels = {
    apply: t("grammar.apply"),
    noSuggestions: t("grammar.noSuggestions"),
    dismiss: t("grammar.dismiss"),
  }
  const grammarOn = Boolean(handlers)
  return (
    <>
      <EditableText
        value={header.name}
        onChange={bind((v) => handlers?.setHeaderField("name", v))}
        placeholder={t("fields.name")}
        ariaLabel={t("fields.name")}
        className={cn("text-4xl font-bold tracking-tight text-neutral-900", nameClass)}
      />
      <EditableText
        value={header.headline}
        onChange={bind((v) => handlers?.setHeaderField("headline", v))}
        placeholder={t("fields.headline")}
        ariaLabel={t("fields.headline")}
        className={cn("mt-1 text-base font-medium", style.accentText, headlineClass)}
        grammar={grammarOn}
        grammarLabels={grammarLabels}
      />
    </>
  )
}

/** Editable contact list. Print skips empty contact rows (no orphan icons). */
function HeaderContacts({ document, style, handlers, className }: HeaderChildProps & { readonly className?: string }) {
  const { header } = document
  const bind = (onChange?: (v: string) => void) => (handlers ? onChange : undefined)
  const allContacts = Array.isArray(header.contacts) ? header.contacts : []
  const contacts = handlers ? allContacts : allContacts.filter((c) => c.value.trim())
  if (contacts.length === 0) return null
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600", className)}>
      {contacts.map((contact) => {
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
  )
}

/**
 * Editable header. Switches on `template.layout` to pick a header treatment while
 * keeping the body a single ATS-safe column. Most layouts share one flow (identity
 * → contacts → separator rule); `banner` and `sidebar` are structurally distinct.
 */
function DocumentHeader(props: HeaderChildProps) {
  const { template, style } = props
  const layout = template.layout

  if (layout === "banner") {
    return (
      <header>
        <div className={cn("-mx-24 -mt-20 mb-4 px-24 py-10", style.accentBg)}>
          <HeaderIdentity {...props} nameClass="text-white" headlineClass="!text-white/90" />
        </div>
        <HeaderContacts {...props} />
        <hr className={cn("mt-4 border-t-2", style.accentBorder)} />
      </header>
    )
  }

  const s = HEADER_STYLE[layout]
  const rule =
    s.rule === "none" ? null : (
      <hr className={cn("mt-4 border-t-2", s.rule === "plain" ? "border-neutral-300" : style.accentBorder)} />
    )

  return (
    <header className={s.wrap}>
      <HeaderIdentity {...props} nameClass={s.name} headlineClass={s.headline} />
      <HeaderContacts {...props} className={cn("mt-3", s.contactList)} />
      {rule}
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

/**
 * Job-ready read-only body — same section layout as the editor, without chrome.
 * Uses {@link BlockFields} with no `update` so fields render as static text/HTML.
 * Fully empty sections (including title) are omitted from print/export.
 */
function ReadOnlyBody({ document, style }: { readonly document: ResumeDocument; readonly style: ResolvedStyle }) {
  const sections = Array.isArray(document.sections) ? document.sections : []
  return (
    <div className={cn("flex flex-col", style.sectionGap)}>
      {sections.map((section) => {
        if (sectionIsEmpty(section)) return null
        return (
          <section key={section.id}>
            <SectionTitle section={section} style={style} />
            <BlockFields block={section} style={style} />
          </section>
        )
      })}
    </div>
  )
}

/**
 * A4 résumé page. Renders a {@link ResumeDocument}; pass `handlers` to make every
 * field inline-editable and the sections drag-reorderable. Without `handlers` it
 * stays a pure read-only render — reusable for previews, print, and PDF export.
 * Fixed width (816px ≈ US Letter).
 */
export function ResumeDocumentView({
  document,
  template,
  style,
  handlers,
  onAiBlock,
  scale,
  print = false,
}: ResumeDocumentProps) {
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
        "w-[816px] min-h-[1056px] shrink-0 bg-white px-24 py-20 text-neutral-800",
        !print && "shadow-2xl",
        style.fontClass
      )}
    >
      <DocumentHeader document={document} template={template} style={style} handlers={handlers} />

      <div className={cn("mt-6 text-[15px]", style.bodyLeading)}>
        {handlers ? (
          <SectionedBody
            blocks={Array.isArray(document.sections) ? document.sections : []}
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
