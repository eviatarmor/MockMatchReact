import { LoginFormPanel } from "@/features/login/right-pane/login-form-panel"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"

export function LoginPageContent() {
  return (
    <div className="flex min-h-screen w-full">
      <AuthHeroPanel trustMessageKey="login:trustMessage" />
      <LoginFormPanel />
    </div>
  )
}
