import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import type {
  DocumentStyle,
  StyleAccentId,
  StyleDensityId,
  StyleHeadingId,
  StyleTypefaceId,
} from "@/components/document-editor"
import {
  STYLE_ACCENTS,
  STYLE_TYPEFACES,
  STYLE_HEADINGS,
  STYLE_DENSITIES,
} from "../constants"
import type { StyleSegmentOption } from "../types"

interface StylePanelProps {
  readonly style: DocumentStyle
  readonly onChange: (patch: Partial<DocumentStyle>) => void
}

function Segmented({ options, value, onChange, columns }: {
  readonly options: readonly StyleSegmentOption[]
  readonly value: string
  readonly onChange: (id: string) => void
  readonly columns: number
}) {
  const { t } = useTranslation("cover-letter-editor")
  return (
    <div
      className="grid gap-1 rounded-lg border border-border/60 bg-muted/40 p-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "cursor-pointer rounded-md px-2 py-1.5 text-center text-sm font-medium transition-colors",
            value === option.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  )
}

/** Visual styling controls — wired live to the document render. */
export function StylePanel({ style, onChange }: StylePanelProps) {
  const { t } = useTranslation("cover-letter-editor")

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <Label className="text-sm font-semibold text-foreground">{t("style.accent")}</Label>
        <div className="flex flex-wrap gap-2">
          {STYLE_ACCENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange({ accent: option.id as StyleAccentId })}
              aria-label={option.id}
              aria-pressed={style.accent === option.id}
              className={cn(
                "size-8 cursor-pointer rounded-full ring-offset-2 ring-offset-background transition-all hover:scale-110",
                option.swatchClass,
                style.accent === option.id && "ring-2 ring-ring"
              )}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <Label className="text-sm font-semibold text-foreground">{t("style.typeface")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_TYPEFACES.map((option) => {
            const isActive = style.typeface === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ typeface: option.id as StyleTypefaceId })}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border/60 hover:border-border hover:bg-muted/40"
                )}
              >
                <span className={cn("text-2xl leading-none text-foreground", option.sampleClass)}>Aa</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{t(option.nameKey)}</span>
                  <span className="block text-xs leading-snug text-muted-foreground">{t(option.descriptionKey)}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <Label className="text-sm font-semibold text-foreground">{t("style.headings")}</Label>
        <Segmented options={STYLE_HEADINGS} value={style.heading} onChange={(id) => onChange({ heading: id as StyleHeadingId })} columns={4} />
      </section>

      <section className="flex flex-col gap-2.5">
        <Label className="text-sm font-semibold text-foreground">{t("style.density")}</Label>
        <Segmented options={STYLE_DENSITIES} value={style.density} onChange={(id) => onChange({ density: id as StyleDensityId })} columns={3} />
      </section>
    </div>
  )
}
