import { Mail } from "lucide-react"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

interface ForgotPasswordSentProps {
  readonly email: string
  readonly resendSecondsLeft: number
  readonly canResend: boolean
  readonly onResend: () => void
}

export function ForgotPasswordSent({ email, resendSecondsLeft, canResend, onResend }: ForgotPasswordSentProps) {
  const { t } = useTranslation("forgot-password")

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Mail className="size-6" />
      </span>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold">{t("sentTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          <Trans
            t={t}
            i18nKey="sentDescription"
            values={{ email }}
            components={{ strong: <strong className="font-semibold text-foreground" /> }}
          />
        </p>
      </div>

      <Button size="lg" className="w-full">
        {t("openEmailAppLabel")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("resendPrompt")}{" "}
        {canResend ? (
          <button type="button" onClick={onResend} className="font-medium text-primary hover:underline">
            {t("resendLabel")}
          </button>
        ) : (
          <span className="font-medium">{t("resendCountdown", { seconds: resendSecondsLeft })}</span>
        )}
      </p>
    </div>
  )
}
