import { useCallback } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"

const STORAGE_KEY = "mm.navCollapsed"

/** Older builds stored plain `"true"` / `"false"`; useLocalStorage JSON-encodes. */
function migrateNavCollapsedFlag() {
  if (typeof window === "undefined") return
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === "true" || raw === "false") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(raw === "true"))
  }
}

// Persisted collapse state for the section-nav column (the icon rail is always
// visible).
export function useNavCollapsed() {
  migrateNavCollapsedFlag()

  const [collapsed, setCollapsed] = useLocalStorage<boolean>(STORAGE_KEY, false)

  const toggle = useCallback(
    () => setCollapsed((prev) => !(prev ?? false)),
    [setCollapsed]
  )
  const expand = useCallback(() => setCollapsed(false), [setCollapsed])

  return { collapsed: collapsed ?? false, toggle, expand }
}
