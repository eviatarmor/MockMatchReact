import { AnimatedThemeToggler } from "@mockmatch/ui/animated-theme-toggler"
import { cn } from "@mockmatch/ui/utils"
import { useExtension } from "../state/extension-store"

/** Same control as client dashboard navbar — light/dark via Magic UI transition. */
export function ThemeToggle({ className }: { readonly className?: string }) {
  const { resolvedTheme, setTheme } = useExtension()

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme}
      onThemeChange={setTheme}
      className={cn(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4",
        className,
      )}
      aria-label="Toggle theme"
    />
  )
}
