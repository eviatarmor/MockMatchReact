import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AuthPasswordField } from "@/components/auth/auth-password-field"
import { ResetPasswordPasswordField } from "@/features/reset-password/right-pane/reset-password-password-field"
import type { ResetPasswordCredentials } from "@mockmatch/schemas"

interface ResetPasswordCredentialsFormProps {
  readonly form: UseFormReturn<ResetPasswordCredentials>
  readonly isSubmitting: boolean
  readonly isPasswordVisible: boolean
  readonly isConfirmPasswordVisible: boolean
  readonly onTogglePasswordVisibility: () => void
  readonly onToggleConfirmPasswordVisibility: () => void
  readonly onSubmit: () => void
}

export function ResetPasswordCredentialsForm({
  form,
  isSubmitting,
  isPasswordVisible,
  isConfirmPasswordVisible,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
  onSubmit,
}: ResetPasswordCredentialsFormProps) {
  const { t } = useTranslation("reset-password")
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form

  const password = watch("password")

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <ResetPasswordPasswordField
        register={register("password")}
        password={password}
        error={errors.password?.message}
        isPasswordVisible={isPasswordVisible}
        onTogglePasswordVisibility={onTogglePasswordVisibility}
      />

      <AuthPasswordField
        register={register("confirmPassword")}
        label={t("confirmPasswordLabel")}
        placeholder={t("confirmPasswordPlaceholder")}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        isPasswordVisible={isConfirmPasswordVisible}
        onTogglePasswordVisibility={onToggleConfirmPasswordVisibility}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submittingLabel") : t("submitLabel")}
      </Button>
    </form>
  )
}
