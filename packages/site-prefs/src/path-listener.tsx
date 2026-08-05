import { useEffect } from "react"
import { trackPageView } from "./analytics"
import { useSitePrefs } from "./site-prefs-context"

export type PathListenerProps = {
  /** Current path including search if desired. */
  readonly path: string
}

/**
 * Host-agnostic pageview tracker. Pass the current route path from the router.
 * Only sends when analytics is allowed and a measurement id was configured.
 */
export function PathListener({ path }: PathListenerProps) {
  const { prefs, hasDecided } = useSitePrefs()

  useEffect(() => {
    if (!hasDecided || !prefs?.analytics) return
    trackPageView(path)
  }, [path, hasDecided, prefs?.analytics])

  return null
}
