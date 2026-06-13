import { LoginFormPanel } from "@/components/auth/login-form-panel"
import { LoginHeroPanel } from "@/components/auth/login-hero-panel"

export function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      <LoginHeroPanel />
      <LoginFormPanel />
    </div>
  )
}
