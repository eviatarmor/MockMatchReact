import { useTranslation } from "react-i18next"
import { LoginCredentialsForm } from "@/features/login/right-pane/login-credentials-form"
import { LoginFooterLinks } from "@/features/login/right-pane/login-footer-links"
import { SocialAuthButtons } from "@/features/login/right-pane/social-auth-buttons"
import { Separator } from "@/components/ui/separator"
import { useLoginForm } from "@/features/login/hooks/use-login-form"
import { useSocialAuth } from "@/features/login/hooks/use-social-auth"

export function LoginFormPanel() {
  const { t } = useTranslation("login")
  const { form, isSubmitting, isPasswordVisible, togglePasswordVisibility, onSubmit } =
    useLoginForm()

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
        />

        <div className="relative flex items-center">
          <Separator className="flex-1" />
          <span className="px-3 text-xs text-muted-foreground">
            {t("dividerLabel")}
          </span>
          <Separator className="flex-1" />
        </div>

        <LoginCredentialsForm
          form={form}
          isSubmitting={isSubmitting}
          isPasswordVisible={isPasswordVisible}
          onTogglePasswordVisibility={togglePasswordVisibility}
          onSubmit={onSubmit}
        />

        <LoginFooterLinks />
      </div>
    </div>
  )
}
