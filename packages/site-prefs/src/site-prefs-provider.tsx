import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { applyPrefsToAnalytics } from "./analytics"
import {
  createPrefs,
  hasDecided,
  readPrefs,
  writePrefs,
} from "./prefs-storage"
import { SitePrefsContext } from "./site-prefs-context"
import type {
  SitePrefs,
  SitePrefsHostOptions,
  SitePrefsLabels,
} from "./types"

export type SitePrefsProviderProps = {
  readonly children: ReactNode
  readonly labels: SitePrefsLabels
  readonly options?: SitePrefsHostOptions
}

/**
 * Public-site visitor prefs. Notice UI is always available after client ready;
 * GA only runs when measurementId is set and analytics is allowed.
 */
export function SitePrefsProvider({
  children,
  labels,
  options = {},
}: SitePrefsProviderProps) {
  const [prefs, setPrefs] = useState<SitePrefs | null>(null)
  const [ready, setReady] = useState(false)

  const cookieDomain = options.cookieDomain
  const measurementId = options.measurementId
  const onPrefsChange = options.onPrefsChange
  const privacyHref = options.privacyHref

  useEffect(() => {
    const stored = readPrefs()
    setPrefs(stored)
    setReady(true)
    // No-op when measurementId unset — notice still shows.
    applyPrefsToAnalytics(stored, measurementId)
  }, [measurementId])

  const persist = useCallback(
    (next: SitePrefs) => {
      writePrefs(next, { cookieDomain })
      setPrefs(next)
      applyPrefsToAnalytics(next, measurementId)
      onPrefsChange?.(next)
    },
    [cookieDomain, measurementId, onPrefsChange]
  )

  const acceptAll = useCallback(() => {
    persist(createPrefs({ analytics: true, performance: true }))
  }, [persist])

  const acceptEssentialOnly = useCallback(() => {
    persist(createPrefs({ analytics: false, performance: false }))
  }, [persist])

  const saveCustom = useCallback(
    (categories: { analytics: boolean; performance: boolean }) => {
      persist(
        createPrefs({
          analytics: categories.analytics,
          performance: categories.performance,
        })
      )
    },
    [persist]
  )

  const value = useMemo(
    () => ({
      prefs,
      ready,
      hasDecided: hasDecided(prefs),
      labels,
      privacyHref,
      acceptAll,
      acceptEssentialOnly,
      saveCustom,
    }),
    [
      prefs,
      ready,
      labels,
      privacyHref,
      acceptAll,
      acceptEssentialOnly,
      saveCustom,
    ]
  )

  return (
    <SitePrefsContext.Provider value={value}>
      {children}
    </SitePrefsContext.Provider>
  )
}
