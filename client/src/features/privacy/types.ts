import type { LucideIcon } from "lucide-react"

export type PrivacySectionId = "privacy" | "cookies" | "data"

export interface PrivacyNavItem {
  readonly id: PrivacySectionId
  readonly labelKey: string
  readonly icon: LucideIcon
}

// Boolean preference toggles, all persisted on the user object.
export interface PrivacyForm {
  allowLocationMetadata: boolean
  allowImproveApp: boolean
  marketingEmails: boolean
  analyticsCookies: boolean
  performanceCookies: boolean
}

export type PrivacyToggleField = keyof PrivacyForm

export interface ToggleOption {
  readonly field: PrivacyToggleField
  readonly labelKey: string
  readonly descriptionKey: string
}
