import type { ReactNode } from "react"
import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { isBlankHtml } from "@/lib/blank-html"
import { cn } from "@/lib/utils"
import {
  EditableText,
  RichTextField,
  type GrammarPopoverLabels,
  type ResolvedStyle,
  type RichTextToolbarLabels,
} from "@/components/document-editor"
import { newEntry } from "../constants"
import type { SectionEntry } from "../types"
import { DateRangeFields } from "./date-range-fields"

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function entryIsEmpty(e: SectionEntry): boolean {
  return (
    !hasText(e.title) &&
    !hasText(e.org) &&
    !hasText(e.location) &&
    !hasText(e.url) &&
    !hasText(e.startDate) &&
    !hasText(e.endDate) &&
    isBlankHtml(e.bullets)
  )
}

function patchRow(rows: readonly SectionEntry[], id: string, patch: Partial<SectionEntry>): SectionEntry[] {
  return rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
}

function removeRow(rows: readonly SectionEntry[], id: string): SectionEntry[] {
  return rows.filter((r) => r.id !== id)
}

interface EntryListFieldsProps {
  readonly entries: readonly SectionEntry[] | null | undefined
  readonly commit: (next: SectionEntry[]) => void
  readonly editable: boolean
  readonly style: ResolvedStyle
  readonly tone?: "page" | "surface"
  readonly titlePh: string
  readonly orgPh: string
  readonly showUrl?: boolean
  readonly richLabels: RichTextToolbarLabels
  readonly grammarLabels: GrammarPopoverLabels
}

/**
 * Grouped dated entries (jobs / degrees / projects / volunteering).
 * Isolated module so date/list logic can't be stuck in a stale HMR closure.
 */
export function EntryListFields({
  entries,
  commit,
  editable,
  style,
  tone = "page",
  titlePh,
  orgPh,
  showUrl = false,
  richLabels,
  grammarLabels,
}: EntryListFieldsProps) {
  const { t } = useTranslation("resume-editor")
  const strong = tone === "page" ? "text-neutral-900" : "text-foreground"
  const muted = tone === "page" ? "text-neutral-500" : "text-muted-foreground"
  const accentText = style.accentText

  const list = (Array.isArray(entries) ? entries : []).filter(
    (e): e is SectionEntry => e != null && typeof e === "object"
  )
  const visible = editable ? list : list.filter((e) => !entryIsEmpty(e))

  const field = (
    value: string,
    onChange: ((v: string) => void) | undefined,
    ph: string,
    className?: string,
    analysisTarget?: string
  ): ReactNode => (
    <EditableText
      value={value ?? ""}
      onChange={editable ? onChange : undefined}
      placeholder={editable ? ph : undefined}
      ariaLabel={ph}
      className={className}
      grammar={editable}
      grammarLabels={grammarLabels}
      analysisTarget={analysisTarget}
    />
  )

  return (
    <div className={cn("flex flex-col gap-4")}>
      {visible.map((e) => {
        const id = e.id || crypto.randomUUID()
        const set = (patch: Partial<SectionEntry>) => commit(patchRow(list, e.id, patch))
        return (
          <div key={id} className="group/row flex flex-col gap-1.5">
            <div className="flex items-start gap-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-x-3">
                  <div className="min-w-0 flex-1">
                    {field(
                      e.title ?? "",
                      (title) => set({ title }),
                      titlePh,
                      cn("text-base font-semibold", strong),
                      `entry:${e.id}:title`
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <DateRangeFields
                      start={e.startDate ?? ""}
                      end={e.endDate ?? ""}
                      onStart={(startDate) => set({ startDate })}
                      onEnd={(endDate) => set({ endDate })}
                      editable={editable}
                      muted={muted}
                      startPh={t("fields.startDate")}
                      endPh={t("fields.endDate")}
                      analysisTarget={`entry:${e.id}:dates`}
                    />
                  </div>
                </div>
                <div className={cn("flex flex-col text-sm", muted)}>
                  {field(e.org ?? "", (org) => set({ org }), orgPh, cn("font-medium", accentText), `entry:${e.id}:org`)}
                  {showUrl
                    ? field(e.url ?? "", (url) => set({ url }), t("fields.url"), cn("text-xs", accentText))
                    : field(e.location ?? "", (location) => set({ location }), t("fields.location"))}
                </div>
              </div>
              {editable ? (
                <button
                  type="button"
                  onClick={() => commit(removeRow(list, e.id))}
                  aria-label={t("rows.removeEntry")}
                  className="pan-ignore mt-1 flex size-4 shrink-0 items-center justify-center rounded text-neutral-300 opacity-0 transition-opacity hover:text-rose-500 group-hover/row:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
            <RichTextField
              value={e.bullets ?? ""}
              onChange={editable ? (bullets) => set({ bullets }) : undefined}
              placeholder={editable ? t("fields.bullet") : undefined}
              ariaLabel={t("fields.bullet")}
              className="leading-relaxed"
              labels={richLabels}
              grammar={editable}
              grammarLabels={grammarLabels}
              analysisTarget={`entry:${e.id}:bullets`}
            />
          </div>
        )
      })}
      {editable ? (
        <button
          type="button"
          onClick={() => commit([...list, newEntry()])}
          className="pan-ignore inline-flex items-center gap-1 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <Plus className="size-3.5" />
          {t("rows.addEntry")}
        </button>
      ) : null}
    </div>
  )
}
