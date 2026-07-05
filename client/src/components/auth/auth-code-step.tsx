import { Mail } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AnimatedOTP } from "@/components/shadcn-space/input-otp/input-otp-09"
import { OTP_LENGTH } from "@/lib/auth/constants"
import type { UseOtpVerificationResult } from "@/hooks/use-otp-verification"

interface AuthCodeStepProps extends UseOtpVerificationResult {
  readonly namespace: "login" | "signup"
  readonly email: string
  readonly onUseDifferentEmail: () => void
}

export function AuthCodeStep({
  namespace,
  email,
  code,
  setCode,
  isSubmitting,
  isComplete,
  resendSecondsLeft,
  canResend,
  onSubmit,
  onResend,
  onUseDifferentEmail,
}: AuthCodeStepProps) {
  const { t } = useTranslation(namespace)

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Mail className="size-6" />
      </span>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold">{t("codeStep.title")}</h1>
        <p className="text-sm text-muted-foreground">
          <Trans
            t={t}
            i18nKey="codeStep.description"
            values={{ email }}
            components={{ strong: <strong className="font-semibold text-foreground" /> }}
          />
        </p>
      </div>

      <AnimatedOTP value={code} onChange={setCode} maxLength={OTP_LENGTH} />

      <Button className="w-full" size="lg" disabled={!isComplete || isSubmitting} onClick={onSubmit}>
        {isSubmitting ? t("codeStep.submittingLabel") : t("codeStep.submitLabel")}
      </Button>

      <p className="text-sm text-muted-foreground">
        {t("codeStep.resendPrompt")}{" "}
        {canResend ? (
          <button type="button" onClick={onResend} className="font-medium text-primary hover:underline">
            {t("codeStep.resendLabel")}
          </button>
        ) : (
          <span className="font-medium">{t("codeStep.resendCountdown", { seconds: resendSecondsLeft })}</span>
        )}
      </p>

      <button
        type="button"
        onClick={onUseDifferentEmail}
        className="text-sm font-medium text-primary hover:underline"
      >
        {t("codeStep.useDifferentEmailLabel")}
      </button>
    </div>
  )
}
