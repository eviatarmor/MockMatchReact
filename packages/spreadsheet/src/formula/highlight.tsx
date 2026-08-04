import { cn } from "@mockmatch/ui/utils"
import {
  assignRefColors,
  formulaTokenStyle,
  tokenizeFormula,
} from "./tokenize"

export type FormulaHighlightProps = {
  readonly value: string
  readonly className?: string
}

/**
 * Colored mirror of formula text (Excel-style functions + multi-hue refs).
 * Must use the **same** font metrics as the overlay input (weight, size,
 * letter-spacing, padding, border) or the caret drifts.
 */
export function FormulaHighlight({ value, className }: FormulaHighlightProps) {
  const tokens = tokenizeFormula(value)
  const refColors = assignRefColors(tokens)

  return (
    <div
      aria-hidden
      data-slot="formula-highlight"
      className={cn(
        // Inline flow only — no flex (flex changes glyph packing vs <input>)
        "pointer-events-none absolute inset-0 z-0 overflow-hidden whitespace-pre font-normal not-italic",
        "[font-kerning:none] [font-variant-ligatures:none]",
        className
      )}
    >
      {tokens.length === 0 ? (
        "\u00a0"
      ) : (
        tokens.map((t, i) => {
          const style = formulaTokenStyle(t, refColors)
          return (
            <span key={`${i}-${t.kind}-${t.text.length}`} style={style}>
              {t.text}
            </span>
          )
        })
      )}
    </div>
  )
}
