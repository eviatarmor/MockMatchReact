/** Stored visitor preference payload (versioned for future re-prompts). */
export type SitePrefs = {
  readonly v: 1
  readonly analytics: boolean
  readonly performance: boolean
  /** Unix ms when the user decided. */
  readonly ts: number
}

export type SitePrefsStorageOptions = {
  /**
   * Parent domain for cross-subdomain sharing, e.g. `.mockmatch.app`.
   * Omit on localhost / non-prod so the value is host-only.
   */
  readonly cookieDomain?: string
  /** Max-Age seconds. Default 1 year. */
  readonly maxAgeSeconds?: number
  /** Force Secure flag. Default: true when protocol is https. */
  readonly secure?: boolean
}

export type SitePrefsLabels = {
  readonly title: string
  readonly description: string
  readonly acceptAll: string
  readonly essentialOnly: string
  readonly customize: string
  readonly savePreferences: string
  readonly essentialLabel: string
  readonly essentialDescription: string
  readonly essentialBadge: string
  readonly analyticsLabel: string
  readonly analyticsDescription: string
  readonly performanceLabel: string
  readonly performanceDescription: string
  readonly privacyLinkLabel?: string
}

export type SitePrefsHostOptions = {
  readonly cookieDomain?: string
  /**
   * Optional GA4 measurement id (`G-…`).
   * Notice still shows when unset — analytics just no-ops.
   */
  readonly measurementId?: string
  readonly privacyHref?: string
  readonly onPrefsChange?: (prefs: SitePrefs) => void
}

export type SitePrefsContextValue = {
  /** Null until client has read storage (avoids SSR/hydration mismatch). */
  readonly prefs: SitePrefs | null
  readonly ready: boolean
  readonly hasDecided: boolean
  readonly labels: SitePrefsLabels
  readonly privacyHref?: string
  readonly acceptAll: () => void
  readonly acceptEssentialOnly: () => void
  readonly saveCustom: (categories: {
    analytics: boolean
    performance: boolean
  }) => void
}
