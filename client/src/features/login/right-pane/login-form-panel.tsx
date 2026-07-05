import { useTranslation } from "react-i18next"
import { LoginStepper } from "@/features/login/right-pane/login-stepper"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { Separator } from "@/components/ui/separator"
import { useSocialAuth } from "@/hooks/use-social-auth"

export function LoginFormPanel() {
  const { t } = useTranslation("login")
  const { pendingProvider, signInWithProvider } = useSocialAuth()

  return (
    <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <SocialAuthButtons
          pendingProvider={pendingProvider}
          onProviderSelect={signInWithProvider}
          googleLabel={t("googleLabel")}
          linkedinLabel={t("linkedinLabel")}
        />

        <div className="relative flex items-center">
          <Separator className="flex-1" />
          <span className="px-3 text-xs text-muted-foreground">
            {t("dividerLabel")}
          </span>
          <Separator className="flex-1" />
        </div>

        <LoginStepper />
      </div>
    </div>
  )
}
