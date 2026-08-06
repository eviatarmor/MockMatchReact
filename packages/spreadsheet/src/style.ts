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
  // Re-build allowing only true booleans and set fields (CellStyle props are readonly)
  const out: CellStyle = {
    ...(next.bold ? { bold: true as const } : {}),
    ...(next.italic ? { italic: true as const } : {}),
    ...(next.underline ? { underline: true as const } : {}),
    ...(next.align ? { align: next.align } : {}),
    ...(next.fill ? { fill: next.fill } : {}),
    ...(next.color ? { color: next.color } : {}),
    ...(next.wrap ? { wrap: true as const } : {}),
  }
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
