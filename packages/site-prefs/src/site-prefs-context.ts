import { createContext, useContext } from "react"
import type { SitePrefsContextValue } from "./types"

export const SitePrefsContext = createContext<SitePrefsContextValue | null>(
  null
)

export function useSitePrefs(): SitePrefsContextValue {
  const value = useContext(SitePrefsContext)
  if (!value) {
    throw new Error("useSitePrefs must be used within SitePrefsProvider")
  }
  return value
}
