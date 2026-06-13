import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"
import { ForgotPasswordChecklist } from "@/features/forgot-password/left-pane/forgot-password-checklist"
import { ForgotPasswordFormPanel } from "@/features/forgot-password/right-pane/forgot-password-form-panel"
import { FORGOT_PASSWORD_CHECKLIST } from "@/features/forgot-password/constants"

export function ForgotPasswordPageContent() {
  const { t } = useTranslation("forgot-password")

  return (
    <div className="flex min-h-screen w-full">
      <AuthHeroPanel
        eyebrowIcon={ShieldCheck}
        eyebrowKey="forgot-password:heroHeadline.eyebrow"
        titleKey="forgot-password:heroHeadline.title"
        descriptionKey="forgot-password:heroHeadline.description"
        middleSlot={<ForgotPasswordChecklist items={FORGOT_PASSWORD_CHECKLIST} />}
        bottomSlot={<p className="text-sm text-white/70">{t("trustMessage")}</p>}
      />
      <ForgotPasswordFormPanel />
    </div>
  )
}
