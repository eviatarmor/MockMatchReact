import { LoginCredentialsForm } from "@/components/login/login-credentials-form"
import { LoginFooterLinks } from "@/components/login/login-footer-links"
import { SocialAuthButtons } from "@/components/login/social-auth-buttons"
import { Separator } from "@/components/ui/separator"
import { useLoginForm } from "@/hooks/use-login-form"
import { useSocialAuth } from "@/hooks/use-social-auth"
import { LOGIN_COPY } from "@/lib/login/constants"

export function LoginFormPanel() {
  const { form, isSubmitting, isPasswordVisible, togglePasswordVisibility, onSubmit } =
    useLoginForm()

  const { pendingProvider, signInWithProvider } = useSocialAuth()

  return (
    <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-bold">{LOGIN_COPY.title}</h2>
          <p className="text-sm text-muted-foreground">{LOGIN_COPY.subtitle}</p>
        </div>

        <SocialAuthButtons
          pendingProvider={pendingProvider}
          onProviderSelect={signInWithProvider}
        />

        <div className="relative flex items-center">
          <Separator className="flex-1" />
          <span className="px-3 text-xs text-muted-foreground">
            {LOGIN_COPY.dividerLabel}
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
