import { useRef } from "react"
import { Check } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@mockmatch/ui/radio-group"
import { SelectCard } from "@mockmatch/ui/card"
import { cn } from "@mockmatch/ui/utils"
import { startThemeViewTransition } from "@mockmatch/ui/lib/theme-view-transition"
import { SectionShell } from "../components/section-shell"
import { useExtension } from "../state/extension-store"
import type { ThemePreference } from "../types"

/** Identical structure to client account-settings AppearanceSection. */
const THEME_OPTIONS: {
  value: ThemePreference
  label: string
  description: string
}[] = [
  { value: "light", label: "Light", description: "Default theme" },
  { value: "dark", label: "Dark", description: "Easier at night" },
  { value: "system", label: "System", description: "Match your OS" },
]

const PREVIEW_BASE: Record<ThemePreference, string> = {
  light: "bg-neutral-100",
  dark: "bg-neutral-900",
  system: "bg-gradient-to-br from-neutral-100 to-neutral-900",
}

// Miniature interface mockup shown on each theme card.
function ThemePreview({ mode }: { readonly mode: ThemePreference }) {
  const base = PREVIEW_BASE[mode]
  const bar = mode === "dark" ? "bg-neutral-700" : "bg-neutral-300"
  const accent = "bg-primary"

  return (
    <div
      className={cn(
        "aspect-[16/10] w-full overflow-hidden rounded-lg p-2 ring-1 ring-foreground/10",
        base,
      )}
    >
      <div className="flex h-full gap-1.5">
        <div className="flex w-1/3 flex-col gap-1">
          <div className={cn("h-1.5 w-full rounded-full", accent)} />
          <div className={cn("h-1.5 w-3/4 rounded-full", bar)} />
          <div className={cn("h-1.5 w-2/3 rounded-full", bar)} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className={cn("h-2 w-1/2 rounded-full", bar)} />
          <div className={cn("flex-1 rounded-md opacity-60", bar)} />
        </div>
      </div>
    </div>
  )
}

export function AppearanceSection() {
  const { settings, setTheme } = useExtension()
  // Capture the card that was pointer-selected so the clip expands from it.
  const originRef = useRef<Element | null>(null)

  const selectTheme = (value: ThemePreference) => {
    if (value === settings.theme) return
    const origin = originRef.current
    originRef.current = null
    startThemeViewTransition({
      origin,
      apply: () => setTheme(value),
    })
  }

  return (
    <SectionShell
      heading="Appearance"
      description="Choose a theme for the MockMatch interface. Resume previews stay in print colours regardless."
    >
      <RadioGroup
        value={settings.theme}
        onValueChange={(value) => selectTheme(value as ThemePreference)}
        className="grid grid-cols-3 gap-3"
      >
        {THEME_OPTIONS.map((option) => {
          const selected = settings.theme === option.value
          return (
            <SelectCard key={option.value} asChild selected={selected}>
              <label
                onPointerDown={(event) => {
                  originRef.current = event.currentTarget
                }}
                className="group/theme relative flex flex-col gap-2 p-2"
              >
                <ThemePreview mode={option.value} />
                <div className="flex items-start justify-between gap-2 px-1 pb-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                  {selected ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : null}
                </div>
                <RadioGroupItem
                  value={option.value}
                  className="absolute size-px overflow-hidden border-0 p-0 opacity-0 after:hidden"
                />
              </label>
            </SelectCard>
          )
        })}
      </RadioGroup>
    </SectionShell>
  )
}
