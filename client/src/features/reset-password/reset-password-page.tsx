import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel"
import { ResetPasswordChecklist } from "@/features/reset-password/left-pane/reset-password-checklist"
import { ResetPasswordFormPanel } from "@/features/reset-password/right-pane/reset-password-form-panel"
import { RESET_PASSWORD_CHECKLIST } from "@/features/reset-password/constants"

export function ResetPasswordPageContent() {
  const { t } = useTranslation("reset-password")

  return (
    <div className="flex min-h-screen w-full">
      <AuthHeroPanel
        eyebrowIcon={ShieldCheck}
        eyebrowKey="reset-password:heroHeadline.eyebrow"
        titleKey="reset-password:heroHeadline.title"
        descriptionKey="reset-password:heroHeadline.description"
        middleSlot={<ResetPasswordChecklist items={RESET_PASSWORD_CHECKLIST} />}
        bottomSlot={<p className="text-sm text-white/70">{t("trustMessage")}</p>}
      />
      <ResetPasswordFormPanel />
    </div>
  )
}
