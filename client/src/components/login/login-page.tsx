import { LoginFormPanel } from "@/components/login/login-form-panel"
import { LoginHeroPanel } from "@/components/login/login-hero-panel"

export function LoginPageContent() {
  return (
    <div className="flex min-h-screen w-full">
      <LoginHeroPanel />
      <LoginFormPanel />
    </div>
  )
}
