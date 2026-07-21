import { Lock, Eye, FileText } from "lucide-react"
import type { PrivacyForm, PrivacyNavItem, ToggleOption } from "@/features/privacy/types"

export const PRIVACY_NAV_ITEMS: readonly PrivacyNavItem[] = [
  { id: "privacy", labelKey: "nav.privacy", icon: Lock },
  { id: "cookies", labelKey: "nav.cookies", icon: Eye },
  { id: "data", labelKey: "nav.data", icon: FileText },
]

export const PRIVACY_TOGGLES: readonly ToggleOption[] = [
  { field: "allowLocationMetadata", labelKey: "privacy.locationMetadata.label", descriptionKey: "privacy.locationMetadata.description" },
  { field: "allowImproveApp", labelKey: "privacy.improveApp.label", descriptionKey: "privacy.improveApp.description" },
  { field: "marketingEmails", labelKey: "privacy.marketingEmails.label", descriptionKey: "privacy.marketingEmails.description" },
]

export const COOKIE_TOGGLES: readonly ToggleOption[] = [
  { field: "analyticsCookies", labelKey: "cookies.analytics.label", descriptionKey: "cookies.analytics.description" },
  { field: "performanceCookies", labelKey: "cookies.performance.label", descriptionKey: "cookies.performance.description" },
]

export const PRIVACY_AUTO_SAVE_DEBOUNCE_MS = 1000

/** Form defaults before account.get resolves. */
export const MOCK_PRIVACY: PrivacyForm = {
  allowLocationMetadata: true,
  allowImproveApp: true,
  marketingEmails: false,
  analyticsCookies: true,
  performanceCookies: true,
}
