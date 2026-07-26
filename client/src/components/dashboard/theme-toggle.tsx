import { useTranslation } from "react-i18next"
import { useTheme } from "@/components/theme-provider"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  readonly className?: string
}

/** Light/dark toggle via Magic UI view-transition. Theme lives in localStorage only. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation("common")
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme}
      onThemeChange={setTheme}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4",
        className
      )}
      aria-label={t("theme.toggle")}
    />
  )
}
