import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { RadioGroup, RadioGroupItem } from "@mockmatch/ui/radio-group"
import { SelectCard } from "@mockmatch/ui/card"
import { cn } from "@/lib/utils"
import { startThemeViewTransition } from "@/lib/theme-view-transition"
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
  // Capture the card that was pointer-selected so the clip expands from it.
  const originRef = useRef<Element | null>(null)

  const selectTheme = (value: ThemeMode) => {
    if (value === theme) return
    const origin = originRef.current
    originRef.current = null
    startThemeViewTransition({
      origin,
      apply: () => setTheme(value),
    })
  }

  return (
    <SectionShell heading={t("appearance.heading")} description={t("appearance.description")}>
      <RadioGroup
        value={theme}
        onValueChange={(value) => selectTheme(value as ThemeMode)}
        className="grid gap-3 sm:grid-cols-3"
      >
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.value
          return (
            <SelectCard
              key={option.value}
              asChild
              selected={selected}
            >
              <label
                onPointerDown={(event) => {
                  originRef.current = event.currentTarget
                }}
                className="group/theme relative flex flex-col gap-2 p-2"
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
            </SelectCard>
          )
        })}
      </RadioGroup>
    </SectionShell>
  )
}
