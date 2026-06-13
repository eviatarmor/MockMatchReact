import type { UseFormRegisterReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { AuthPasswordField } from "@/components/auth/auth-password-field"
import { PasswordStrengthMeter } from "@/features/reset-password/right-pane/password-strength-meter"

interface ResetPasswordPasswordFieldProps {
  readonly register: UseFormRegisterReturn
  readonly password: string
  readonly error?: string
  readonly isPasswordVisible: boolean
  readonly onTogglePasswordVisibility: () => void
}

export function ResetPasswordPasswordField({
  register,
  password,
  error,
  isPasswordVisible,
  onTogglePasswordVisibility,
}: ResetPasswordPasswordFieldProps) {
  const { t } = useTranslation("reset-password")

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
