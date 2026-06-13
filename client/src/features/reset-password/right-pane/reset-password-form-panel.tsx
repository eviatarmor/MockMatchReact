import { Lock } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { ResetPasswordCredentialsForm } from "@/features/reset-password/right-pane/reset-password-credentials-form"
import { ResetPasswordFooterLinks } from "@/features/reset-password/right-pane/reset-password-footer-links"
import { ResetPasswordSuccess } from "@/features/reset-password/right-pane/reset-password-success"
import { useResetPasswordForm } from "@/features/reset-password/hooks/use-reset-password-form"
import type { ResetPasswordLocationState } from "@/features/reset-password/types"
import { useLocation } from "react-router-dom"

export function ResetPasswordFormPanel() {
  const { t } = useTranslation("reset-password")
  const location = useLocation()
  const email = (location.state as ResetPasswordLocationState | null)?.email ?? ""

  const {
    form,
    isSubmitting,
    isSuccess,
    isPasswordVisible,
    isConfirmPasswordVisible,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    onSubmit,
  } = useResetPasswordForm()

  if (isSuccess) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <ResetPasswordSuccess />
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="size-6" />
        </span>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            <Trans
              t={t}
              i18nKey="description"
              values={{ email }}
              components={{ strong: <strong className="font-semibold text-foreground" /> }}
            />
          </p>
        </div>

        <ResetPasswordCredentialsForm
          form={form}
          isSubmitting={isSubmitting}
          isPasswordVisible={isPasswordVisible}
          isConfirmPasswordVisible={isConfirmPasswordVisible}
          onTogglePasswordVisibility={togglePasswordVisibility}
          onToggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
          onSubmit={onSubmit}
        />

        <ResetPasswordFooterLinks />
      </div>
    </div>
  )
}
