/**
 * Shared visual-style model for the document editors (cover letter + résumé).
 *
 * A template supplies the *defaults*; the Style panel lets the user override each
 * axis. `resolveStyleClasses` turns the chosen axes into the concrete Tailwind
 * classes the canvas + field editors apply, so the same resolution logic drives
 * both editors and the read-only/export render.
 *
 * ATS note: every option here is parser-safe — it changes color/typography/
 * spacing only. No multi-column, tables, or image-based text.
 */

export type StyleAccentId = "blue" | "teal" | "indigo" | "emerald" | "amber" | "rose" | "purple" | "slate"
export type StyleTypefaceId = "geist" | "source-serif" | "newsreader" | "mono"
export type StyleHeadingId = "accent" | "underline" | "small-caps" | "plain"
export type StyleDensityId = "compact" | "normal" | "relaxed"

/** The four user-tunable style axes. A template provides the initial values. */
export interface DocumentStyle {
  readonly accent: StyleAccentId
  readonly typeface: StyleTypefaceId
  readonly heading: StyleHeadingId
  readonly density: StyleDensityId
}

/** Per-accent Tailwind classes (text / bg / border), light + dark. */
const ACCENT_CLASSES: Record<StyleAccentId, { readonly text: string; readonly bg: string; readonly border: string }> = {
  blue: { text: "text-blue-600 dark:text-blue-500", bg: "bg-blue-600", border: "border-blue-600" },
  teal: { text: "text-teal-600 dark:text-teal-500", bg: "bg-teal-600", border: "border-teal-600" },
  indigo: { text: "text-indigo-600 dark:text-indigo-500", bg: "bg-indigo-600", border: "border-indigo-600" },
  emerald: { text: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-600", border: "border-emerald-600" },
  amber: { text: "text-amber-600 dark:text-amber-500", bg: "bg-amber-500", border: "border-amber-500" },
  rose: { text: "text-rose-600 dark:text-rose-500", bg: "bg-rose-500", border: "border-rose-500" },
  purple: { text: "text-purple-600 dark:text-purple-500", bg: "bg-purple-500", border: "border-purple-500" },
  slate: { text: "text-slate-700 dark:text-slate-300", bg: "bg-slate-700", border: "border-slate-700" },
}

/** Per-typeface font-family class. */
const TYPEFACE_CLASSES: Record<StyleTypefaceId, string> = {
  geist: "font-sans",
  "source-serif": "font-serif",
  newsreader: "font-serif",
  mono: "font-mono",
}

/** Whether a typeface is serif — some templates center/serify the name off this. */
export function isSerifTypeface(typeface: StyleTypefaceId): boolean {
  return TYPEFACE_CLASSES[typeface] === "font-serif"
}

/** Vertical rhythm between sections, driven by density. */
const DENSITY_GAP: Record<StyleDensityId, string> = {
  compact: "gap-3",
  normal: "gap-5",
  relaxed: "gap-7",
}

/** Body line-height, driven by density. */
const DENSITY_LEADING: Record<StyleDensityId, string> = {
  compact: "leading-snug",
  normal: "leading-relaxed",
  relaxed: "leading-loose",
}

/**
 * The concrete classes a document render applies for a chosen {@link DocumentStyle}.
 * Section headings resolve differently per `heading` treatment; the accent color
 * still tints the name/rule even when headings are plain/underlined.
 */
export interface ResolvedStyle {
  readonly accentText: string
  readonly accentBg: string
  readonly accentBorder: string
  readonly fontClass: string
  readonly serif: boolean
  /** Class for a section-title label (uppercase/underline/etc). */
  readonly headingClass: string
  /** Vertical gap between sections. */
  readonly sectionGap: string
  /** Body text leading. */
  readonly bodyLeading: string
}

export function resolveStyleClasses(style: DocumentStyle): ResolvedStyle {
  const accent = ACCENT_CLASSES[style.accent]
  const serif = isSerifTypeface(style.typeface)

  let headingClass: string
  switch (style.heading) {
    case "accent":
      headingClass = `text-sm font-semibold uppercase tracking-wide ${accent.text}`
      break
    case "underline":
      headingClass = `text-sm font-semibold uppercase tracking-wide text-neutral-900 border-b-2 pb-0.5 ${accent.border}`
      break
    case "small-caps":
      headingClass = "text-sm font-semibold uppercase tracking-[0.2em] text-neutral-800"
      break
    case "plain":
      headingClass = "text-sm font-semibold text-neutral-900"
      break
  }

  return {
    accentText: accent.text,
    accentBg: accent.bg,
    accentBorder: accent.border,
    fontClass: TYPEFACE_CLASSES[style.typeface],
    serif,
    headingClass,
    sectionGap: DENSITY_GAP[style.density],
    bodyLeading: DENSITY_LEADING[style.density],
  }
}
