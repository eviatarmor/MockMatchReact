import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { SectionShell } from "@/components/layout/section-shell"
import { THEME_OPTIONS } from "@/features/account-settings/constants"
import type { ThemeMode } from "@/features/account-settings/types"

const PREVIEW_BASE: Record<ThemeMode, string> = {
  light: "bg-neutral-100",
  dark: "bg-neutral-900",
  system: "bg-gradient-to-br from-neutral-100 to-neutral-900",
}

// Miniature interface mockup shown on each theme card.
function ThemePreview({ mode }: { readonly mode: ThemeMode }) {
  const base = PREVIEW_BASE[mode]
  const bar = mode === "dark" ? "bg-neutral-700" : "bg-neutral-300"
  const accent = "bg-primary"

  return (
    <div className={cn("aspect-[16/10] w-full overflow-hidden rounded-md p-2", base)}>
      <div className="flex h-full gap-1.5">
        <div className="flex w-1/3 flex-col gap-1">
          <div className={cn("h-1.5 w-full rounded-full", accent)} />
          <div className={cn("h-1.5 w-3/4 rounded-full", bar)} />
          <div className={cn("h-1.5 w-2/3 rounded-full", bar)} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className={cn("h-2 w-1/2 rounded-full", bar)} />
          <div className={cn("flex-1 rounded", bar, "opacity-60")} />
        </div>
      </div>
    </div>
  )
}

export function AppearanceSection() {
  const { t } = useTranslation("account-settings")
  const { theme, setTheme } = useTheme()

  return (
    <SectionShell heading={t("appearance.heading")} description={t("appearance.description")}>
      <RadioGroup
        value={theme}
        onValueChange={(value) => setTheme(value as ThemeMode)}
        className="grid gap-3 sm:grid-cols-3"
      >
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "group/theme relative flex cursor-pointer flex-col gap-2 rounded-xl bg-card p-2 ring-1 transition-colors",
                selected ? "ring-2 ring-primary" : "ring-foreground/10 hover:ring-primary"
              )}
            >
              <ThemePreview mode={option.value} />
              <div className="flex items-start justify-between gap-2 px-1 pb-1">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{t(option.labelKey)}</span>
                  <span className="text-xs text-muted-foreground">{t(option.descriptionKey)}</span>
                </div>
                {selected && <Check className="size-4 shrink-0 text-primary" />}
              </div>
              <RadioGroupItem value={option.value} className="sr-only" />
            </label>
          )
        })}
      </RadioGroup>
    </SectionShell>
  )
}
