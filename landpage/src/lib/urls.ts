/** Product app origin (login/signup). Override with VITE_APP_URL. */
export const APP_URL = (
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5173"
)

/** Public product docs. Override with VITE_DOCS_URL. */
export const DOCS_URL = (
  (import.meta.env.VITE_DOCS_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://docs.mockmatch.ai"
)

export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${APP_URL}${normalized}`
}
