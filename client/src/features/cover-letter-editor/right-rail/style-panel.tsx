import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const ACCENTS = [
  { id: "blue", className: "bg-blue-600" },
  { id: "teal", className: "bg-teal-600" },
  { id: "violet", className: "bg-violet-600" },
  { id: "rose", className: "bg-rose-600" },
  { id: "amber", className: "bg-amber-500" },
  { id: "neutral", className: "bg-neutral-800" },
] as const

const FONT_SCALES = ["S", "M", "L"] as const
const SPACINGS = ["compact", "cozy", "roomy"] as const

/** Visual styling controls (presentational scaffold — not yet wired to state). */
export function StylePanel() {
  const { t } = useTranslation("cover-letter-editor")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{t("style.accent")}</Label>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((accent, index) => (
            <button
              key={accent.id}
              type="button"
              className={cn(
                "size-7 cursor-pointer rounded-full ring-offset-2 ring-offset-background transition-all hover:scale-110",
                accent.className,
                index === 0 && "ring-2 ring-ring"
              )}
              aria-label={accent.id}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{t("style.fontSize")}</Label>
        <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-1">
          {FONT_SCALES.map((scale, index) => (
            <button
              key={scale}
              type="button"
              className={cn(
                "cursor-pointer rounded-md py-1.5 text-sm font-medium transition-colors",
                index === 1 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {scale}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{t("style.spacing")}</Label>
        <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border/60 bg-muted/40 p-1">
          {SPACINGS.map((spacing, index) => (
            <button
              key={spacing}
              type="button"
              className={cn(
                "cursor-pointer rounded-md py-1.5 text-sm font-medium transition-colors",
                index === 1 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`style.spacings.${spacing}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
