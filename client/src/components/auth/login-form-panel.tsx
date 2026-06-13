import { LoginCredentialsForm } from "@/components/auth/login-credentials-form"
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons"
import { Separator } from "@/components/ui/separator"
import { useLoginForm } from "@/hooks/use-login-form"
import { useSocialAuth } from "@/hooks/use-social-auth"
import { LOGIN_COPY } from "@/lib/auth/constants"

export function LoginFormPanel() {
  const {
    credentials,
    isSubmitting,
    isPasswordVisible,
    setEmail,
    setPassword,
    togglePasswordVisibility,
    handleSubmit,
  } = useLoginForm()

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
          credentials={credentials}
          isSubmitting={isSubmitting}
          isPasswordVisible={isPasswordVisible}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePasswordVisibility={togglePasswordVisibility}
          onSubmit={handleSubmit}
        />

        <p className="text-center text-sm text-muted-foreground">
          {LOGIN_COPY.signUpPrompt}{" "}
          <a href="#" className="font-medium text-primary hover:underline">
            {LOGIN_COPY.signUpLabel}
          </a>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          {LOGIN_COPY.termsPrefix}{" "}
          <a href="#" className="underline">
            {LOGIN_COPY.termsLabel}
          </a>{" "}
          and{" "}
          <a href="#" className="underline">
            {LOGIN_COPY.privacyLabel}
          </a>
          .
        </p>
      </div>
    </div>
  )
}
