export const appName = 'MockMatch Docs'
export const docsRoute = '/docs'
export const docsContentRoute = '/llms.mdx/docs'

/** Product app base URL (client Vite in local dev). */
export const appUrl =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:5173'
