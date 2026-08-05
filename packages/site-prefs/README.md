# `@mockmatch/site-prefs`

Host-agnostic visitor preference notice + optional GA4 (gtag) base for **public** MockMatch surfaces (docs, marketing).

## Not for SaaS

Do **not** mount `SiteNotice` in the signed-in app (`client/`). Product users accept Terms / Privacy on auth.

## Why this name

Package/file paths avoid common ad-block patterns (`cookie-consent`, `consent-banner`, etc.) that trigger `ERR_BLOCKED_BY_CLIENT` in browsers with extensions enabled.

## Notice without Google

`SiteNotice` shows whenever the visitor has not decided.  
`measurementId` is optional — if unset, analytics is a no-op but the notice still works.

## Cross-subdomain prefs

Storage cookie: `mm_site_prefs`.

In production, hosts should pass:

```ts
cookieDomain: ".mockmatch.app"
```

so `mockmatch.app` and `docs.mockmatch.app` share one decision. Omit on localhost.

## Usage

```tsx
import {
  SitePrefsProvider,
  SiteNotice,
  PathListener,
} from "@mockmatch/site-prefs"

<SitePrefsProvider
  labels={/* required copy */}
  options={{
    cookieDomain: import.meta.env.PROD ? ".mockmatch.app" : undefined,
    measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID, // optional
    privacyHref: "/docs/account/settings",
  }}
>
  <PathListener path={pathname} />
  <SiteNotice />
  {children}
</SitePrefsProvider>
```
