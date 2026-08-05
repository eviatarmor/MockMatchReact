import { AnimatedThemeToggler } from '@mockmatch/ui/animated-theme-toggler'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

type DocsThemeToggleProps = {
  readonly className?: string
}

/**
 * Same Magic UI circle view-transition as the product client theme toggle.
 * Controlled via next-themes (Fumadocs RootProvider).
 */
export function DocsThemeToggle({ className }: DocsThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid SSR/hydration mismatch; after mount match client ThemeToggle pattern.
  const theme: 'light' | 'dark' =
    mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      className={cn(
        'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg',
        'text-fd-muted-foreground transition-colors',
        'hover:bg-fd-accent hover:text-fd-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
        '[&_svg]:size-4',
        className
      )}
      aria-label="Toggle theme"
    />
  )
}
