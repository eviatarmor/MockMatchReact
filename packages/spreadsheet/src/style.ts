import type { CellStyle } from "./types"

/** Merge style patches; `null` clears. Empty object after merge → undefined. */
export function mergeCellStyle(
  prev: CellStyle | undefined,
  patch: CellStyle | null
): CellStyle | undefined {
  if (patch === null) return undefined
  const next: CellStyle = { ...prev, ...patch }
  // Drop undefined keys from patch overwrites that set false? keep booleans
  const cleaned: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(next)) {
    if (v !== undefined && v !== false && v !== "") {
      cleaned[k] = v
    }
    // keep explicit false for toggles? bold:false should clear bold
    if (v === false) {
      // omit — treated as off
    }
  }
  // Re-build allowing only true booleans and set fields
  const out: CellStyle = {}
  if (next.bold) out.bold = true
  if (next.italic) out.italic = true
  if (next.underline) out.underline = true
  if (next.align) out.align = next.align
  if (next.fill) out.fill = next.fill
  if (next.color) out.color = next.color
  if (next.wrap) out.wrap = true
  return Object.keys(out).length > 0 ? out : undefined
}

/** Toggle a boolean style flag across a patch. */
export function toggleStyleFlag(
  prev: CellStyle | undefined,
  flag: "bold" | "italic" | "underline" | "wrap"
): CellStyle {
  const on = !prev?.[flag]
  return { [flag]: on }
}
