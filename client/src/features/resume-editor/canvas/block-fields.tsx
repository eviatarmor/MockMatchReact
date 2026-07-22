import type { ReactNode } from "react"
import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import {
  EditableText,
  RichTextField,
  type GrammarPopoverLabels,
  type ResolvedStyle,
  type RichTextToolbarLabels,
} from "@/components/document-editor"
import { sectionIsEmpty } from "../section-snippet"
import type {
  BulletItem,
  LanguageItem,
  ReferenceItem,
  ResumeSection,
} from "../types"
import { EntryListFields } from "./entry-list-fields"

interface BlockFieldsProps {
  readonly block: ResumeSection
  readonly style: ResolvedStyle
  /**
   * Patch the section in the document store. When omitted the fields render
   * read-only (print / export) — no placeholders, add/remove chrome, or grammar.
   */
  readonly update?: (patch: Partial<ResumeSection>) => void
  /**
   * Color context for the editable text.
   * - `page` (default): dark ink for the white A4 canvas.
   * - `surface`: theme `foreground`, for the mobile sheet (light + dark mode).
   */
  readonly tone?: "page" | "surface"
}

const newId = () => crypto.randomUUID()

/** Insert / patch / remove helpers over a stably-keyed row list (pure). */
function addRow<T>(rows: readonly T[], row: T): T[] {
  return [...rows, row]
}
function patchRow<T extends { id: string }>(rows: readonly T[], id: string, patch: Partial<T>): T[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
}
function removeRow<T extends { id: string }>(rows: readonly T[], id: string): T[] {
  return rows.filter((r) => r.id !== id)
}

/** Visible text in plain fields (print skips blanks). */
function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

/** A small "+ add" affordance shared by every nested row list. */
function AddRowButton({ label, onClick }: { readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pan-ignore inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
    >
      <Plus className="size-3.5" />
      {label}
    </button>
  )
}

/** A small "remove this row" affordance shown on row hover. */
function RemoveRowButton({ label, onClick }: { readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pan-ignore mt-1 flex size-4 shrink-0 items-center justify-center rounded text-neutral-300 opacity-0 transition-opacity hover:text-rose-500 group-hover/row:opacity-100"
    >
      <X className="size-3.5" />
    </button>
  )
}

/**
 * The per-type editable fields for a single resume section. Switches on
 * `section.type` and renders structured fields with the shared document-editor
 * primitives. Shared between the desktop canvas (wrapped in `SortableBlock`
 * chrome by `SectionedBody`) and the mobile edit sheet, so the field/editor
 * logic lives in exactly one place.
 */
// Large per-section switch (print empty-field filtering included) — complexity
// lives in the type matrix, not nested control flow that can be simplified.
// eslint-disable-next-line sonarjs/cognitive-complexity -- section switch
export function BlockFields({ block, style, update, tone = "page" }: BlockFieldsProps) {
  const { t } = useTranslation("resume-editor")
  const editable = typeof update === "function"
  const strong = tone === "page" ? "text-neutral-900" : "text-foreground"
  const muted = tone === "page" ? "text-neutral-500" : "text-muted-foreground"
  const accentText = style.accentText
  const headingClass = style.headingClass

  // Print/export: omit fully empty sections (title handled by ReadOnlyBody).
  if (!editable && sectionIsEmpty(block)) return null

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

  const field = (
    value: string,
    onChange: ((v: string) => void) | undefined,
    ph: string,
    className?: string
  ) => (
    <EditableText
      value={value}
      onChange={editable ? onChange : undefined}
      placeholder={editable ? ph : undefined}
      ariaLabel={ph}
      className={className}
      grammar={editable}
      grammarLabels={grammarLabels}
    />
  )

  /**
   * A title line with its date pushed to the far right on the same baseline —
   * "University of Minnesota ———— May 2011". Used at the top of every entry.
   */
  const titleRow = (title: ReactNode, date: ReactNode) => (
    <div className="flex items-baseline justify-between gap-x-3">
      <div className="min-w-0 flex-1">{title}</div>
      <div className="shrink-0 text-right">{date}</div>
    </div>
  )

  switch (block.type) {
    case "summary":
      return (
        <RichTextField
          value={block.text}
          onChange={editable ? (text) => update({ text }) : undefined}
          placeholder={editable ? t("fields.summary") : undefined}
          ariaLabel={t("sections.summary")}
          className="text-justify leading-relaxed"
          labels={richLabels}
          grammar={editable}
          grammarLabels={grammarLabels}
        />
      )

    case "experience":
      return (
        <EntryListFields
          entries={"entries" in block ? block.entries : []}
          commit={(entries) => update?.({ entries })}
          editable={editable}
          style={style}
          tone={tone}
          titlePh={t("fields.role")}
          orgPh={t("fields.company")}
          richLabels={richLabels}
          grammarLabels={grammarLabels}
        />
      )

    case "education":
      return (
        <EntryListFields
          entries={"entries" in block ? block.entries : []}
          commit={(entries) => update?.({ entries })}
          editable={editable}
          style={style}
          tone={tone}
          titlePh={t("fields.degree")}
          orgPh={t("fields.school")}
          richLabels={richLabels}
          grammarLabels={grammarLabels}
        />
      )

    case "skills": {
      const items = Array.isArray(block.items) ? block.items : []
      const commit = (next: BulletItem[]) => update?.({ items: next })
      const visible = editable ? items : items.filter((it) => hasText(it.text))
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {visible.map((it) => (
            <span key={it.id} className="group/tag inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {field(it.text, (text) => commit(patchRow(items, it.id, { text })), t("fields.skill"))}
              {editable ? (
                <button
                  type="button"
                  aria-label={t("rows.removeSkill")}
                  onClick={() => commit(removeRow(items, it.id))}
                  className="pan-ignore text-neutral-400 opacity-0 transition-opacity hover:text-rose-500 group-hover/tag:opacity-100"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </span>
          ))}
          {editable ? (
            <AddRowButton label={t("rows.addSkill")} onClick={() => commit(addRow(items, { id: newId(), text: "" }))} />
          ) : null}
        </div>
      )
    }

    case "projects":
      return (
        <EntryListFields
          entries={"entries" in block ? block.entries : []}
          commit={(entries) => update?.({ entries })}
          editable={editable}
          style={style}
          tone={tone}
          titlePh={t("fields.projectName")}
          orgPh={t("fields.organization")}
          showUrl
          richLabels={richLabels}
          grammarLabels={grammarLabels}
        />
      )

    case "volunteering":
      return (
        <EntryListFields
          entries={"entries" in block ? block.entries : []}
          commit={(entries) => update?.({ entries })}
          editable={editable}
          style={style}
          tone={tone}
          titlePh={t("fields.role")}
          orgPh={t("fields.organization")}
          richLabels={richLabels}
          grammarLabels={grammarLabels}
        />
      )

    case "awards":
      return (
        <div className="flex flex-col gap-1">
          {titleRow(
            field(block.title, (title) => update?.({ title }), t("fields.awardTitle"), cn("text-base font-semibold", strong)),
            field(block.date, (date) => update?.({ date }), t("fields.date"), cn("text-xs", muted))
          )}
          {field(block.issuer, (issuer) => update?.({ issuer }), t("fields.issuer"), cn("text-sm font-medium", accentText))}
          <RichTextField
            value={block.description}
            onChange={editable ? (description) => update({ description }) : undefined}
            placeholder={editable ? t("fields.description") : undefined}
            ariaLabel={t("fields.description")}
            className="text-sm leading-relaxed"
            labels={richLabels}
            grammar={editable}
            grammarLabels={grammarLabels}
          />
        </div>
      )

    case "certifications":
      return (
        <div className="flex flex-col gap-1">
          {titleRow(
            field(block.name, (name) => update?.({ name }), t("fields.certName"), cn("text-base font-semibold", strong)),
            field(block.date, (date) => update?.({ date }), t("fields.date"), cn("text-xs", muted))
          )}
          <div className={cn("flex flex-wrap items-baseline gap-x-2 text-sm", muted)}>
            {field(block.issuer, (issuer) => update?.({ issuer }), t("fields.issuer"), cn("font-medium", accentText))}
            {field(block.credentialId, (credentialId) => update?.({ credentialId }), t("fields.credentialId"))}
          </div>
        </div>
      )

    case "publications":
      return (
        <div className="flex flex-col gap-1">
          {titleRow(
            field(block.title, (title) => update?.({ title }), t("fields.pubTitle"), cn("text-base font-semibold", strong)),
            field(block.date, (date) => update?.({ date }), t("fields.date"), cn("text-xs", muted))
          )}
          <div className={cn("flex flex-wrap items-baseline gap-x-2 text-sm", muted)}>
            {field(block.publisher, (publisher) => update?.({ publisher }), t("fields.publisher"), cn("font-medium", accentText))}
            {field(block.url, (url) => update?.({ url }), t("fields.url"))}
          </div>
        </div>
      )

    case "languages": {
      const items = Array.isArray(block.items) ? block.items : []
      const commit = (next: LanguageItem[]) => update?.({ items: next })
      const visible = editable
        ? items
        : items.filter((l) => hasText(l.name) || hasText(l.proficiency))
      return (
        <div className="flex flex-col gap-1.5">
          {visible.map((l) => {
            const showDash = editable || (hasText(l.name) && hasText(l.proficiency))
            return (
              <div key={l.id} className="group/row flex items-baseline gap-2">
                {(editable || hasText(l.name)) &&
                  field(l.name, (name) => commit(patchRow(items, l.id, { name })), t("fields.language"), cn("text-sm font-medium", strong))}
                {showDash ? <span className={muted}>—</span> : null}
                {(editable || hasText(l.proficiency)) &&
                  field(l.proficiency, (proficiency) => commit(patchRow(items, l.id, { proficiency })), t("fields.proficiency"), cn("text-sm", muted))}
                {editable ? (
                  <RemoveRowButton label={t("rows.removeLanguage")} onClick={() => commit(removeRow(items, l.id))} />
                ) : null}
              </div>
            )
          })}
          {editable ? (
            <AddRowButton label={t("rows.addLanguage")} onClick={() => commit(addRow(items, { id: newId(), name: "", proficiency: "" }))} />
          ) : null}
        </div>
      )
    }

    case "affiliations": {
      const showDot = editable || (hasText(block.organization) && hasText(block.role))
      return titleRow(
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          {(editable || hasText(block.organization)) &&
            field(block.organization, (organization) => update?.({ organization }), t("fields.organization"), cn("text-base font-semibold", strong))}
          {showDot ? <span className={muted}>·</span> : null}
          {(editable || hasText(block.role)) &&
            field(block.role, (role) => update?.({ role }), t("fields.role"), cn("font-medium", accentText))}
        </div>,
        field(block.date, (date) => update?.({ date }), t("fields.date"), cn("text-xs", muted))
      )
    }

    case "hobbies": {
      const items = Array.isArray(block.items) ? block.items : []
      const commit = (next: BulletItem[]) => update?.({ items: next })
      const visible = editable ? items : items.filter((h) => hasText(h.text))
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {visible.map((h) => (
            <span key={h.id} className="group/tag inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {field(h.text, (text) => commit(patchRow(items, h.id, { text })), t("fields.hobby"))}
              {editable ? (
                <button
                  type="button"
                  aria-label={t("rows.removeHobby")}
                  onClick={() => commit(removeRow(items, h.id))}
                  className="pan-ignore text-neutral-400 opacity-0 transition-opacity hover:text-rose-500 group-hover/tag:opacity-100"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </span>
          ))}
          {editable ? (
            <AddRowButton label={t("rows.addHobby")} onClick={() => commit(addRow(items, { id: newId(), text: "" }))} />
          ) : null}
        </div>
      )
    }

    case "references": {
      const items = Array.isArray(block.items) ? block.items : []
      const commit = (next: ReferenceItem[]) => update?.({ items: next })
      const visible = editable
        ? items
        : items.filter((r) => hasText(r.name) || hasText(r.relation) || hasText(r.contact))
      return (
        <div className="flex flex-col gap-2">
          {visible.map((r) => (
            <div key={r.id} className="group/row flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                {field(r.name, (name) => commit(patchRow(items, r.id, { name })), t("fields.refName"), cn("text-sm font-semibold", strong))}
                {field(r.relation, (relation) => commit(patchRow(items, r.id, { relation })), t("fields.refRelation"), cn("text-xs", muted))}
                {editable ? (
                  <RemoveRowButton label={t("rows.removeReference")} onClick={() => commit(removeRow(items, r.id))} />
                ) : null}
              </div>
              {field(r.contact, (contact) => commit(patchRow(items, r.id, { contact })), t("fields.refContact"), cn("text-sm", accentText))}
            </div>
          ))}
          {editable ? (
            <AddRowButton label={t("rows.addReference")} onClick={() => commit(addRow(items, { id: newId(), name: "", relation: "", contact: "" }))} />
          ) : null}
        </div>
      )
    }

    case "custom":
      return (
        <div className="flex flex-col gap-1.5">
          <EditableText
            value={block.heading}
            onChange={editable ? (heading) => update({ heading }) : undefined}
            placeholder={editable ? t("fields.customHeading") : undefined}
            ariaLabel={t("sections.custom")}
            className={headingClass}
            grammar={editable}
            grammarLabels={grammarLabels}
          />
          <RichTextField
            value={block.text}
            onChange={editable ? (text) => update({ text }) : undefined}
            placeholder={editable ? t("fields.description") : undefined}
            ariaLabel={t("sections.custom")}
            className="leading-relaxed"
            labels={richLabels}
            grammar={editable}
            grammarLabels={grammarLabels}
          />
        </div>
      )
  }
}
