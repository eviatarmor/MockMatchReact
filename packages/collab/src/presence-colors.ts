/**
 * Shared collab presence paint tokens (resume RemoteCursors + IDE Monaco).
 * Keep both surfaces on the same numbers so multiplayer looks identical.
 */

/** Selection highlight opacity over peer color (resume: opacity 0.28). */
export const COLLAB_SELECTION_OPACITY = 0.28

/** Soft caret outline: peer color at ~20% (resume: boxShadow `…33`). */
export const COLLAB_CARET_GLOW_ALPHA = 0x33 / 0xff

/** Parse #RRGGBB (or #RGB) → rgb channels. */
export function parseHexColor(
  hex: string
): { r: number; g: number; b: number } | null {
  const raw = hex.replace("#", "").trim()
  if (raw.length === 3) {
    const r = Number.parseInt(raw[0]! + raw[0]!, 16)
    const g = Number.parseInt(raw[1]! + raw[1]!, 16)
    const b = Number.parseInt(raw[2]! + raw[2]!, 16)
    if ([r, g, b].some((n) => Number.isNaN(n))) return null
    return { r, g, b }
  }
  if (raw.length !== 6) return null
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

/** Selection fill — same as resume RemoteCursors highlight. */
export function collabSelectionBackground(color: string): string {
  const rgb = parseHexColor(color)
  if (!rgb) return color
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${COLLAB_SELECTION_OPACITY})`
}

/** Caret / pointer solid peer color. */
export function collabSolidColor(color: string): string {
  return color
}

/** Soft 1px ring around caret (resume caret boxShadow). */
export function collabCaretBoxShadow(color: string): string {
  const rgb = parseHexColor(color)
  if (!rgb) return `0 0 0 1px ${color}33`
  return `0 0 0 1px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${COLLAB_CARET_GLOW_ALPHA})`
}
