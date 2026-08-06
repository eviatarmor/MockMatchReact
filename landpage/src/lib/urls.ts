const DEFAULT_APP_URL = "http://localhost:5173"
const DEFAULT_DOCS_URL = "https://docs.mockmatch.ai"

/**
 * Build-time public origins only.
 * Fail closed to defaults when the value is missing, unparseable, or not http(s).
 * Rejects protocol-relative (`//…`), `javascript:`, `data:`, credentials abuse, etc.
 */
function safeHttpOrigin(raw: string | undefined, fallback: string): string {
  if (raw == null) return fallback
  const candidate = raw.trim()
  if (!candidate || candidate.startsWith("//")) return fallback

  try {
    const url = new URL(candidate)
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback

    url.username = ""
    url.password = ""
    url.search = ""
    url.hash = ""

    const path = url.pathname.replace(/\/+$/, "")
    return path && path !== "/" ? `${url.origin}${path}` : url.origin
  } catch {
    return fallback
  }
}

/** Product app origin (login/signup). Override with VITE_APP_URL. */
export const APP_URL = safeHttpOrigin(
  import.meta.env.VITE_APP_URL,
  DEFAULT_APP_URL
)

/** Public product docs. Override with VITE_DOCS_URL. */
export const DOCS_URL = safeHttpOrigin(
  import.meta.env.VITE_DOCS_URL,
  DEFAULT_DOCS_URL
)

/** Join a hard-coded app path onto the validated app origin. */
export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  try {
    return new URL(normalized, `${APP_URL}/`).href
  } catch {
    return new URL(normalized, `${DEFAULT_APP_URL}/`).href
  }
}
