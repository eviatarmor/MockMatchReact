import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "mm.navCollapsed"

// Persisted collapse state for the section-nav column (the icon rail is always
// visible). Read once on mount, then mirrored to localStorage on change.
export function useNavCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem(STORAGE_KEY) === "true"
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const toggle = useCallback(() => setCollapsed((prev) => !prev), [])
  const expand = useCallback(() => setCollapsed(false), [])

  return { collapsed, toggle, expand }
}
