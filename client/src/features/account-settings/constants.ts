import { User, Palette, Mic, Globe, Shield } from "lucide-react"
import type {
  AccountSettingsForm,
  NavItem,
  SelectOption,
  ThemeOption,
  VoiceOption,
  Country,
  DateFormat,
  TimeFormat,
} from "@/features/account-settings/types"

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "profile", labelKey: "nav.profile", icon: User },
  { id: "appearance", labelKey: "nav.appearance", icon: Palette },
  { id: "voice", labelKey: "nav.voice", icon: Mic },
  { id: "region", labelKey: "nav.region", icon: Globe },
  { id: "account", labelKey: "nav.account", icon: Shield },
]

export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: "light", labelKey: "appearance.themes.light.label", descriptionKey: "appearance.themes.light.description" },
  { value: "dark", labelKey: "appearance.themes.dark.label", descriptionKey: "appearance.themes.dark.description" },
  { value: "system", labelKey: "appearance.themes.system.label", descriptionKey: "appearance.themes.system.description" },
]

export const VOICE_OPTIONS: readonly VoiceOption[] = [
  { value: "buttery", nameKey: "voice.voices.buttery.name", localeKey: "voice.voices.buttery.locale", genderKey: "voice.voices.buttery.gender", descriptionKey: "voice.voices.buttery.description" },
  { value: "resonant", nameKey: "voice.voices.resonant.name", localeKey: "voice.voices.resonant.locale", genderKey: "voice.voices.resonant.gender", descriptionKey: "voice.voices.resonant.description" },
  { value: "mellow", nameKey: "voice.voices.mellow.name", localeKey: "voice.voices.mellow.locale", genderKey: "voice.voices.mellow.gender", descriptionKey: "voice.voices.mellow.description" },
  { value: "airy", nameKey: "voice.voices.airy.name", localeKey: "voice.voices.airy.locale", genderKey: "voice.voices.airy.gender", descriptionKey: "voice.voices.airy.description" },
  { value: "polished", nameKey: "voice.voices.polished.name", localeKey: "voice.voices.polished.locale", genderKey: "voice.voices.polished.gender", descriptionKey: "voice.voices.polished.description" },
  { value: "rounded", nameKey: "voice.voices.rounded.name", localeKey: "voice.voices.rounded.locale", genderKey: "voice.voices.rounded.gender", descriptionKey: "voice.voices.rounded.description" },
]

export const COUNTRY_OPTIONS: readonly SelectOption<Country>[] = [
  { value: "US", labelKey: "region.countries.US" },
  { value: "AU", labelKey: "region.countries.AU" },
  { value: "GB", labelKey: "region.countries.GB" },
]

export const DATE_FORMAT_OPTIONS: readonly SelectOption<DateFormat>[] = [
  { value: "DD/MM/YYYY", labelKey: "region.dateFormats.DD/MM/YYYY" },
  { value: "MM/DD/YYYY", labelKey: "region.dateFormats.MM/DD/YYYY" },
  { value: "YYYY/MM/DD", labelKey: "region.dateFormats.YYYY/MM/DD" },
]

export const TIME_FORMAT_OPTIONS: readonly SelectOption<TimeFormat>[] = [
  { value: "12h", labelKey: "region.timeFormats.12h" },
  { value: "24h", labelKey: "region.timeFormats.24h" },
]

// Locale (dialect) shown in the live region preview, keyed by country.
export const COUNTRY_DIALECT_KEY: Record<Country, string> = {
  US: "region.dialects.US",
  AU: "region.dialects.AU",
  GB: "region.dialects.GB",
}

export const AUTO_SAVE_DEBOUNCE_MS = 1000

// Mock current user — no backend wired up yet.
export const MOCK_ACCOUNT: AccountSettingsForm & { email: string; fullName: string } = {
  fullName: "Jordan Avery",
  email: "jordan.avery@example.com",
  voiceProfile: "mellow",
  country: "US",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
}
