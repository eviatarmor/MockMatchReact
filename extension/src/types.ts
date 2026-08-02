export type ThemePreference = "light" | "dark" | "system"

export type PanelRoute = "apply" | "settings" | "account"

export type ChipState =
  | "idle"
  | "ready"
  | "filling"
  | "review"
  | "error"

export type FormDetection =
  | { status: "none" }
  | {
      status: "detected"
      site: string
      company: string
      role: string
      fieldCount: number
    }

export type CoverLetterMode = "skip" | "existing" | "tailor"

export type FillPhase = "idle" | "filling" | "review" | "done"

export interface ResumeItem {
  readonly id: string
  readonly title: string
  readonly updatedLabel: string
  readonly isFit?: boolean
}

export interface CoverLetterItem {
  readonly id: string
  readonly title: string
  readonly updatedLabel: string
}

export interface ProfileSummary {
  readonly fullName: string
  readonly email: string
  readonly phone: string
  readonly linkedIn: string
  readonly location: string
}

export interface ReviewField {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly confidence: "high" | "medium" | "low"
  readonly needsReview: boolean
}

export interface ExtensionSettings {
  theme: ThemePreference
  autoDetectForms: boolean
  autoOpenPanelOnDetect: boolean
  highlightFilledFields: boolean
  rememberLastResume: boolean
  defaultCoverLetterMode: CoverLetterMode
  prepareApplications: boolean
  confirmBeforeFill: boolean
}

export interface SessionUser {
  readonly id: string
  readonly fullName: string
  readonly email: string
  readonly initials: string
}

export interface ExtensionState {
  signedIn: boolean
  user: SessionUser | null
  route: PanelRoute
  form: FormDetection
  resumes: readonly ResumeItem[]
  coverLetters: readonly CoverLetterItem[]
  selectedResumeId: string | null
  selectedCoverLetterId: string | null
  coverLetterMode: CoverLetterMode
  tailorDraft: string
  tailorLoading: boolean
  profile: ProfileSummary | null
  fillPhase: FillPhase
  chipState: ChipState
  reviewFields: readonly ReviewField[]
  settings: ExtensionSettings
  /** Resolved light/dark (system preference applied). */
  resolvedTheme: "light" | "dark"
  authError: string | null
  banner: string | null
}
