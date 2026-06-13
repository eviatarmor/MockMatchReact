import { LoginFormPanel } from "@/features/login/right-pane/login-form-panel"
import { LoginHeroPanel } from "@/features/login/left-pane/login-hero-panel"

export function LoginPageContent() {
  return (
    <div className="flex min-h-screen w-full">
      <LoginHeroPanel />
      <LoginFormPanel />
    </div>
  )
}
