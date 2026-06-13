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
