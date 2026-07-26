import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { useLocalStorage, useMediaQuery } from "@uidotdev/usehooks"

export type Theme = "dark" | "light" | "system"
export type ResolvedTheme = "dark" | "light"

interface ThemeProviderProps {
  readonly children: ReactNode
  readonly defaultTheme?: Theme
  readonly storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY_DEFAULT = "mockmatch-theme"
const THEMES = new Set<Theme>(["dark", "light", "system"])

/**
 * useLocalStorage JSON-encodes values. Older builds stored a raw theme string
 * (`dark`); re-encode once so JSON.parse does not throw.
 */
function migrateThemeStorage(key: string) {
  if (typeof window === "undefined") return
  const raw = window.localStorage.getItem(key)
  if (raw === null) return
  try {
    JSON.parse(raw)
  } catch {
    if (THEMES.has(raw as Theme)) {
      window.localStorage.setItem(key, JSON.stringify(raw))
    }
  }
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = window.document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY_DEFAULT,
  ...props
}: ThemeProviderProps) {
  migrateThemeStorage(storageKey)

  const [theme, setThemeState] = useLocalStorage<Theme>(storageKey, defaultTheme)
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)")

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (prefersDark ? "dark" : "light") : theme

  useEffect(() => {
    applyThemeClass(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback(
    (next: Theme) => {
      // Sync class before React paint so Magic UI View Transitions snapshot correctly.
      const resolved: ResolvedTheme =
        next === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : next
      applyThemeClass(resolved)
      setThemeState(next)
    },
    [setThemeState]
  )

  const value = useMemo(
    () => ({
      theme: theme ?? defaultTheme,
      resolvedTheme,
      setTheme,
    }),
    [theme, defaultTheme, resolvedTheme, setTheme]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
