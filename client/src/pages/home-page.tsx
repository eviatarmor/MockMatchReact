import { Navigate } from "react-router-dom"

import { NAV_SECTIONS } from "@/components/dashboard/constants"

/** First sidebar item — default landing after `/`. */
const DEFAULT_APP_PATH = NAV_SECTIONS[0].items[0].href

/**
 * `/` always redirects into the app. Unauthenticated users hit RequireAuth
 * on the dashboard route and land on `/login`.
 */
export function HomePage() {
  return <Navigate to={DEFAULT_APP_PATH} replace />
}
