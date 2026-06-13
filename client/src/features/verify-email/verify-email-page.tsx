import { Mail, Rocket } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AnimatedOTP } from "@/components/shadcn-space/input-otp/input-otp-09"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"
import { SignupSocialProof } from "@/features/signup/left-pane/signup-social-proof"
import { GetStartedStepList } from "@/features/signup/left-pane/get-started-step-list"
import { GET_STARTED_STEPS } from "@/features/signup/constants"
import { useVerifyEmailForm } from "@/features/verify-email/hooks/use-verify-email-form"
import { OTP_LENGTH } from "@/features/verify-email/constants"
import type { VerifyEmailLocationState } from "@/features/verify-email/types"

export function VerifyEmailPageContent() {
  const { t } = useTranslation("verify-email")
  const location = useLocation()
  const email = (location.state as VerifyEmailLocationState | null)?.email ?? ""

  const { code, setCode, isSubmitting, isComplete, resendSecondsLeft, canResend, onSubmit, onResend } =
    useVerifyEmailForm()

  return (
    <div className="flex min-h-screen w-full">
      <AuthHeroPanel
        eyebrowIcon={Rocket}
        eyebrowKey="signup:heroHeadline.eyebrow"
        titleKey="signup:heroHeadline.title"
        descriptionKey="signup:heroHeadline.description"
        middleSlot={<GetStartedStepList steps={GET_STARTED_STEPS} />}
        bottomSlot={<SignupSocialProof />}
      />

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-6" />
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

          <AnimatedOTP value={code} onChange={setCode} maxLength={OTP_LENGTH} />

          <Button className="w-full" size="lg" disabled={!isComplete || isSubmitting} onClick={onSubmit}>
            {isSubmitting ? t("submittingLabel") : t("submitLabel")}
          </Button>

          <p className="text-sm text-muted-foreground">
            {t("resendPrompt")}{" "}
            {canResend ? (
              <button
                type="button"
                onClick={onResend}
                className="font-medium text-primary hover:underline"
              >
                {t("resendLabel")}
              </button>
            ) : (
              <span className="font-medium">
                {t("resendCountdown", { seconds: resendSecondsLeft })}
              </span>
            )}
          </p>

          <Link to="/signup" className="text-sm font-medium text-primary hover:underline">
            {t("useDifferentEmailLabel")}
          </Link>
        </div>
      </div>
    </div>
  )
}
