import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react"
import { Moon, Sun } from "lucide-react"

import {
  startThemeViewTransition,
  type TransitionVariant,
} from "@/lib/theme-view-transition"
import { cn } from "@/lib/utils"

export type { TransitionVariant }

interface AnimatedThemeTogglerProps extends ComponentPropsWithoutRef<"button"> {
  duration?: number
  variant?: TransitionVariant
  /** When true, the transition expands from the viewport center instead of the button center. */
  fromCenter?: boolean
  /**
   * Controlled theme value. When provided, the parent owns persistence
   * (e.g. ThemeProvider localStorage) and this component will not write to localStorage.
   */
  theme?: "light" | "dark"
  /** Called on toggle. Pair with `theme` for controlled usage. */
  onThemeChange?: (theme: "light" | "dark") => void
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  variant,
  fromCenter = false,
  theme,
  onThemeChange,
  ...props
}: AnimatedThemeTogglerProps) => {
  const shape = variant ?? "circle"
  const isControlled = theme !== undefined
  const [internalIsDark, setInternalIsDark] = useState(false)
  const isDark = isControlled ? theme === "dark" : internalIsDark
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isControlled) return

    const updateTheme = () => {
      setInternalIsDark(document.documentElement.classList.contains("dark"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [isControlled])

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    startThemeViewTransition({
      origin: button,
      fromCenter,
      duration,
      variant: shape,
      apply: () => {
        const newTheme = !isDark
        // Keep class flip in the VT callback so the snapshot matches Magic UI.
        document.documentElement.classList.toggle("dark")
        if (isControlled) {
          onThemeChange?.(newTheme ? "dark" : "light")
        } else {
          setInternalIsDark(newTheme)
          localStorage.setItem("theme", newTheme ? "dark" : "light")
        }
      },
    })
  }, [shape, fromCenter, duration, isDark, isControlled, onThemeChange])

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isDark ? <Sun /> : <Moon />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
