import { Key } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ForgotPasswordRequestForm } from "@/features/forgot-password/right-pane/forgot-password-request-form"
import { ForgotPasswordSent } from "@/features/forgot-password/right-pane/forgot-password-sent"
import { ForgotPasswordFooterLinks } from "@/features/forgot-password/right-pane/forgot-password-footer-links"
import { useForgotPasswordForm } from "@/features/forgot-password/hooks/use-forgot-password-form"

export function ForgotPasswordFormPanel() {
  const { t } = useTranslation("forgot-password")

  const { form, isSubmitting, isSent, submittedEmail, resendSecondsLeft, canResend, onSubmit, onResend } =
    useForgotPasswordForm()

  return (
    <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {isSent ? (
          <ForgotPasswordSent
            email={submittedEmail}
            resendSecondsLeft={resendSecondsLeft}
            canResend={canResend}
            onResend={onResend}
          />
        ) : (
          <>
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Key className="size-6" />
            </span>

            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("description")}</p>
            </div>

            <ForgotPasswordRequestForm form={form} isSubmitting={isSubmitting} onSubmit={onSubmit} />
          </>
        )}

        <ForgotPasswordFooterLinks />
      </div>
    </div>
  )
}
