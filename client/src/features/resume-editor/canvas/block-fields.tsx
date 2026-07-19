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
import { newEntry } from "../constants"
import type {
  BulletItem,
  LanguageItem,
  ReferenceItem,
  ResumeSection,
  SectionEntry,
} from "../types"

interface BlockFieldsProps {
  readonly block: ResumeSection
  readonly style: ResolvedStyle
  /** Patch the section in the document store. */
  readonly update: (patch: Partial<ResumeSection>) => void
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
export function BlockFields({ block, style, update, tone = "page" }: BlockFieldsProps) {
  const { t } = useTranslation("resume-editor")
  const strong = tone === "page" ? "text-neutral-900" : "text-foreground"
  const muted = tone === "page" ? "text-neutral-500" : "text-muted-foreground"
  const accentText = style.accentText
  const headingClass = style.headingClass

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

  const field = (value: string, onChange: (v: string) => void, ph: string, className?: string) => (
    <EditableText
      value={value}
      onChange={onChange}
      placeholder={ph}
      ariaLabel={ph}
      className={className}
    />
  )

  /** A compact date range (start – end). */
  const dateRange = (start: string, end: string, onStart: (v: string) => void, onEnd: (v: string) => void) => (
    <div className={cn("flex items-center gap-1 text-xs", muted)}>
      {field(start, onStart, t("fields.startDate"))}
      <span>–</span>
      {field(end, onEnd, t("fields.endDate"))}
    </div>
  )

  /**
   * A title line with its date pushed to the far right on the same baseline —
   * "University of Minnesota ———— May 2011". Used at the top of every entry.
   */
  const titleRow = (title: ReactNode, date: ReactNode) => (
    <div className="flex items-baseline justify-between gap-x-3">
      <div className="min-w-0 flex-1">{title}</div>
      <div className="w-40 shrink-0 text-right">{date}</div>
    </div>
  )

  /**
   * The free-form body for a grouped entry. A single Lexical rich-text field —
   * the user decides bullets vs. paragraphs (toolbar list button), like the cover
   * letter editor.
   */
  const bodyField = (value: string, onChange: (html: string) => void) => (
    <RichTextField
      value={value}
      onChange={onChange}
      placeholder={t("fields.bullet")}
      ariaLabel={t("fields.bullet")}
      className="leading-relaxed"
      labels={richLabels}
      grammar
      grammarLabels={grammarLabels}
    />
  )

  /**
   * A grouped list of dated entries (jobs, degrees, projects, volunteering roles).
   * Each entry: title + date on one baseline, an org/location line, then a rich
   * body. `+ add` appends a blank entry; each entry can be removed on hover.
   * `showUrl` swaps the org/location line for a project-style name + URL treatment.
   */
  const entryList = (
    entries: readonly SectionEntry[],
    commit: (next: SectionEntry[]) => void,
    opts: { readonly titlePh: string; readonly orgPh: string; readonly showUrl?: boolean }
  ) => (
    <div className="flex flex-col gap-4">
      {entries.map((e) => {
        const set = (patch: Partial<SectionEntry>) => commit(patchRow(entries, e.id, patch))
        return (
          <div key={e.id} className="group/row flex flex-col gap-1.5">
            <div className="flex items-start gap-1.5">
              <div className="min-w-0 flex-1">
                {titleRow(
                  field(e.title, (title) => set({ title }), opts.titlePh, cn("text-base font-semibold", strong)),
                  dateRange(e.startDate, e.endDate, (startDate) => set({ startDate }), (endDate) => set({ endDate }))
                )}
                <div className={cn("flex flex-wrap items-baseline gap-x-3 text-sm", muted)}>
                  {field(e.org, (org) => set({ org }), opts.orgPh, cn("font-medium", accentText))}
                  {opts.showUrl
                    ? field(e.url, (url) => set({ url }), t("fields.url"), cn("text-xs", accentText))
                    : field(e.location, (location) => set({ location }), t("fields.location"))}
                </div>
              </div>
              <RemoveRowButton label={t("rows.removeEntry")} onClick={() => commit(removeRow(entries, e.id))} />
            </div>
            {bodyField(e.bullets, (bullets) => set({ bullets }))}
          </div>
        )
      })}
      <AddRowButton label={t("rows.addEntry")} onClick={() => commit(addRow(entries, newEntry()))} />
    </div>
  )

  switch (block.type) {
    case "summary":
      return (
        <RichTextField
          value={block.text}
          onChange={(text) => update({ text })}
          placeholder={t("fields.summary")}
          ariaLabel={t("sections.summary")}
          className="text-justify leading-relaxed"
          labels={richLabels}
          grammar
          grammarLabels={grammarLabels}
        />
      )

    case "experience":
      return entryList(block.entries, (entries) => update({ entries }), {
        titlePh: t("fields.role"),
        orgPh: t("fields.company"),
      })

    case "education":
      return entryList(block.entries, (entries) => update({ entries }), {
        titlePh: t("fields.degree"),
        orgPh: t("fields.school"),
      })

    case "skills": {
      const items = block.items
      const commit = (next: BulletItem[]) => update({ items: next })
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((it) => (
            <span key={it.id} className="group/tag inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {field(it.text, (text) => commit(patchRow(items, it.id, { text })), t("fields.skill"))}
              <button
                type="button"
                aria-label={t("rows.removeSkill")}
                onClick={() => commit(removeRow(items, it.id))}
                className="pan-ignore text-neutral-400 opacity-0 transition-opacity hover:text-rose-500 group-hover/tag:opacity-100"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <AddRowButton label={t("rows.addSkill")} onClick={() => commit(addRow(items, { id: newId(), text: "" }))} />
        </div>
      )
    }

    case "projects":
      return entryList(block.entries, (entries) => update({ entries }), {
        titlePh: t("fields.projectName"),
        orgPh: t("fields.organization"),
        showUrl: true,
      })

    case "volunteering":
      return entryList(block.entries, (entries) => update({ entries }), {
        titlePh: t("fields.role"),
        orgPh: t("fields.organization"),
      })

    case "awards":
      return (
        <div className="flex flex-col gap-1">
          {titleRow(
            field(block.title, (title) => update({ title }), t("fields.awardTitle"), cn("text-base font-semibold", strong)),
            field(block.date, (date) => update({ date }), t("fields.date"), cn("text-xs", muted))
          )}
          {field(block.issuer, (issuer) => update({ issuer }), t("fields.issuer"), cn("text-sm font-medium", accentText))}
          <RichTextField
            value={block.description}
            onChange={(description) => update({ description })}
            placeholder={t("fields.description")}
            ariaLabel={t("fields.description")}
            className="text-sm leading-relaxed"
            labels={richLabels}
            grammar
            grammarLabels={grammarLabels}
          />
        </div>
      )

    case "certifications":
      return (
        <div className="flex flex-col gap-1">
          {titleRow(
            field(block.name, (name) => update({ name }), t("fields.certName"), cn("text-base font-semibold", strong)),
            field(block.date, (date) => update({ date }), t("fields.date"), cn("text-xs", muted))
          )}
          <div className={cn("flex flex-wrap items-baseline gap-x-2 text-sm", muted)}>
            {field(block.issuer, (issuer) => update({ issuer }), t("fields.issuer"), cn("font-medium", accentText))}
            {field(block.credentialId, (credentialId) => update({ credentialId }), t("fields.credentialId"))}
          </div>
        </div>
      )

    case "publications":
      return (
        <div className="flex flex-col gap-1">
          {titleRow(
            field(block.title, (title) => update({ title }), t("fields.pubTitle"), cn("text-base font-semibold", strong)),
            field(block.date, (date) => update({ date }), t("fields.date"), cn("text-xs", muted))
          )}
          <div className={cn("flex flex-wrap items-baseline gap-x-2 text-sm", muted)}>
            {field(block.publisher, (publisher) => update({ publisher }), t("fields.publisher"), cn("font-medium", accentText))}
            {field(block.url, (url) => update({ url }), t("fields.url"))}
          </div>
        </div>
      )

    case "languages": {
      const items = block.items
      const commit = (next: LanguageItem[]) => update({ items: next })
      return (
        <div className="flex flex-col gap-1.5">
          {items.map((l) => (
            <div key={l.id} className="group/row flex items-baseline gap-2">
              {field(l.name, (name) => commit(patchRow(items, l.id, { name })), t("fields.language"), cn("text-sm font-medium", strong))}
              <span className={muted}>—</span>
              {field(l.proficiency, (proficiency) => commit(patchRow(items, l.id, { proficiency })), t("fields.proficiency"), cn("text-sm", muted))}
              <RemoveRowButton label={t("rows.removeLanguage")} onClick={() => commit(removeRow(items, l.id))} />
            </div>
          ))}
          <AddRowButton label={t("rows.addLanguage")} onClick={() => commit(addRow(items, { id: newId(), name: "", proficiency: "" }))} />
        </div>
      )
    }

    case "affiliations":
      return titleRow(
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          {field(block.organization, (organization) => update({ organization }), t("fields.organization"), cn("text-base font-semibold", strong))}
          <span className={muted}>·</span>
          {field(block.role, (role) => update({ role }), t("fields.role"), cn("font-medium", accentText))}
        </div>,
        field(block.date, (date) => update({ date }), t("fields.date"), cn("text-xs", muted))
      )

    case "hobbies": {
      const items = block.items
      const commit = (next: BulletItem[]) => update({ items: next })
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((h) => (
            <span key={h.id} className="group/tag inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
              {field(h.text, (text) => commit(patchRow(items, h.id, { text })), t("fields.hobby"))}
              <button
                type="button"
                aria-label={t("rows.removeHobby")}
                onClick={() => commit(removeRow(items, h.id))}
                className="pan-ignore text-neutral-400 opacity-0 transition-opacity hover:text-rose-500 group-hover/tag:opacity-100"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <AddRowButton label={t("rows.addHobby")} onClick={() => commit(addRow(items, { id: newId(), text: "" }))} />
        </div>
      )
    }

    case "references": {
      const items = block.items
      const commit = (next: ReferenceItem[]) => update({ items: next })
      return (
        <div className="flex flex-col gap-2">
          {items.map((r) => (
            <div key={r.id} className="group/row flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                {field(r.name, (name) => commit(patchRow(items, r.id, { name })), t("fields.refName"), cn("text-sm font-semibold", strong))}
                {field(r.relation, (relation) => commit(patchRow(items, r.id, { relation })), t("fields.refRelation"), cn("text-xs", muted))}
                <RemoveRowButton label={t("rows.removeReference")} onClick={() => commit(removeRow(items, r.id))} />
              </div>
              {field(r.contact, (contact) => commit(patchRow(items, r.id, { contact })), t("fields.refContact"), cn("text-sm", accentText))}
            </div>
          ))}
          <AddRowButton label={t("rows.addReference")} onClick={() => commit(addRow(items, { id: newId(), name: "", relation: "", contact: "" }))} />
        </div>
      )
    }

    case "custom":
      return (
        <div className="flex flex-col gap-1.5">
          <EditableText
            value={block.heading}
            onChange={(heading) => update({ heading })}
            placeholder={t("fields.customHeading")}
            ariaLabel={t("sections.custom")}
            className={headingClass}
            grammar
            grammarLabels={grammarLabels}
          />
          <RichTextField
            value={block.text}
            onChange={(text) => update({ text })}
            placeholder={t("fields.description")}
            ariaLabel={t("sections.custom")}
            className="leading-relaxed"
            labels={richLabels}
            grammar
            grammarLabels={grammarLabels}
          />
        </div>
      )
  }
}
