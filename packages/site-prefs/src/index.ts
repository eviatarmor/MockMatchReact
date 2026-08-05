/**
 * Product-agnostic visitor prefs + optional GA4 base for public surfaces
 * (docs, marketing). Host supplies labels and storage domain.
 *
 * Do not mount SiteNotice inside the signed-in SaaS app.
 *
 * Package path avoids "cookie-consent" / "consent-banner" so ad blockers
 * do not block the module in dev.
 */

export {
  DEFAULT_PREFS_MAX_AGE_SECONDS,
  SITE_PREFS_COOKIE_NAME,
  SITE_PREFS_VERSION,
} from "./constants"

export {
  buildPrefsCookieString,
  createPrefs,
  hasDecided,
  parsePrefs,
  readPrefs,
  serializePrefs,
  writePrefs,
} from "./prefs-storage"

export {
  applyPrefsToAnalytics,
  disableGa,
  initGa,
  trackEvent,
  trackPageView,
} from "./analytics"

export {
  SitePrefsProvider,
  type SitePrefsProviderProps,
} from "./site-prefs-provider"

export { SiteNotice, type SiteNoticeProps } from "./site-notice"

export { PathListener, type PathListenerProps } from "./path-listener"

export { useSitePrefs } from "./site-prefs-context"

export type {
  SitePrefs,
  SitePrefsContextValue,
  SitePrefsHostOptions,
  SitePrefsLabels,
  SitePrefsStorageOptions,
} from "./types"
