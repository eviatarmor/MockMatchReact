import type { GetStartedStep } from "@/features/signup/types"

export interface PasswordStrengthCheck {
  labelKey: string
  test: (password: string) => boolean
}

export const PASSWORD_STRENGTH_CHECKS: readonly PasswordStrengthCheck[] = [
  { labelKey: "passwordChecks.length", test: (password) => password.length >= 8 },
  { labelKey: "passwordChecks.number", test: (password) => /\d/.test(password) },
  { labelKey: "passwordChecks.uppercase", test: (password) => /[A-Z]/.test(password) },
  { labelKey: "passwordChecks.special", test: (password) => /[^A-Za-z0-9]/.test(password) },
]

export const GET_STARTED_STEPS: readonly GetStartedStep[] = [
  { id: "buildResume", step: 1, titleKey: "getStartedSteps.buildResume.title", descriptionKey: "getStartedSteps.buildResume.description" },
  { id: "runMockInterview", step: 2, titleKey: "getStartedSteps.runMockInterview.title", descriptionKey: "getStartedSteps.runMockInterview.description" },
  { id: "trackApplications", step: 3, titleKey: "getStartedSteps.trackApplications.title", descriptionKey: "getStartedSteps.trackApplications.description" },
]
