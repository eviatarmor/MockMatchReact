import {
  PathListener,
  SiteNotice,
  SitePrefsProvider,
  type SitePrefsLabels,
} from '@mockmatch/site-prefs'
import { useLocation } from 'react-router'

const LABELS: SitePrefsLabels = {
  title: 'Cookies on MockMatch',
  description:
    'We use essential cookies to run this site. Optional analytics and performance cookies help us understand usage and fix issues. You can change your choice any time by clearing site cookies.',
  acceptAll: 'Accept all',
  essentialOnly: 'Essential only',
  customize: 'Customize',
  savePreferences: 'Save preferences',
  essentialLabel: 'Essential',
  essentialDescription: 'Required for the site to work. Always on.',
  essentialBadge: 'Always on',
  analyticsLabel: 'Analytics',
  analyticsDescription:
    'Aggregated metrics on which pages and features people use.',
  performanceLabel: 'Performance',
  performanceDescription: 'Crash and slowdown reports to help us fix issues.',
  privacyLinkLabel: 'Learn more',
}

function measurementId(): string | undefined {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  const trimmed = id?.trim()
  return trimmed || undefined
}

function cookieDomain(): string | undefined {
  // Share prefs across mockmatch.app + docs.mockmatch.app in production only.
  if (!import.meta.env.PROD) return undefined
  return '.mockmatch.app'
}

/**
 * Public-site visitor prefs notice + optional GA.
 * Mount only on docs/marketing — not the SaaS app.
 * Notice always shows when undecided, even if GA measurement id is unset.
 */
export function SitePrefsHost() {
  const location = useLocation()
  const path = `${location.pathname}${location.search}`

  return (
    <SitePrefsProvider
      labels={LABELS}
      options={{
        cookieDomain: cookieDomain(),
        measurementId: measurementId(),
        privacyHref: '/docs/account/settings',
      }}
    >
      <PathListener path={path} />
      <SiteNotice />
    </SitePrefsProvider>
  )
}
