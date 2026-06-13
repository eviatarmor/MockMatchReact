import type { UseFormRegisterReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AuthPasswordField } from "@/components/auth/auth-password-field"
import { PasswordStrengthMeter } from "@/features/signup/right-pane/password-strength-meter"

interface SignupPasswordFieldProps {
  readonly register: UseFormRegisterReturn
  readonly password: string
  readonly error?: string
  readonly isPasswordVisible: boolean
  readonly onTogglePasswordVisibility: () => void
}

export function SignupPasswordField({
  register,
  password,
  error,
  isPasswordVisible,
  onTogglePasswordVisibility,
}: SignupPasswordFieldProps) {
  const { t } = useTranslation("signup")

  return (
    <AuthPasswordField
      register={register}
      label={t("passwordLabel")}
      placeholder={t("passwordPlaceholder")}
      autoComplete="new-password"
      error={error}
      isPasswordVisible={isPasswordVisible}
      onTogglePasswordVisibility={onTogglePasswordVisibility}
      belowField={<PasswordStrengthMeter password={password} />}
    />
  )
}
