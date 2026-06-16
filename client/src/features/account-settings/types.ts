import type { LucideIcon } from "lucide-react"
import type { Theme } from "@/components/theme-provider"

export type ThemeMode = Theme

export type VoiceProfile =
  | "buttery"
  | "resonant"
  | "mellow"
  | "airy"
  | "polished"
  | "rounded"

export type Country = "US" | "AU" | "GB"

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY/MM/DD"

export type TimeFormat = "12h" | "24h"

export type SectionId = "profile" | "appearance" | "voice" | "region" | "account"

export interface NavItem {
  readonly id: SectionId
  readonly labelKey: string
  readonly icon: LucideIcon
}

export interface ThemeOption {
  readonly value: ThemeMode
  readonly labelKey: string
  readonly descriptionKey: string
}

export interface VoiceOption {
  readonly value: VoiceProfile
  readonly nameKey: string
  readonly localeKey: string
  readonly genderKey: string
  readonly descriptionKey: string
}

export interface SelectOption<TValue extends string = string> {
  readonly value: TValue
  readonly labelKey: string
}

// Fields auto-saved to the backend (theme is persisted separately to localStorage).
export interface AccountSettingsForm {
  fullName: string
  voiceProfile: VoiceProfile
  country: Country
  dateFormat: DateFormat
  timeFormat: TimeFormat
}
