import { BadgeCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

/**
 * Trust line only — no fabricated headcount or stock avatars
 * (PRODUCT.md: do not invent user metrics).
 */
export function SignupSocialProof() {
  const { t } = useTranslation("signup")

  return (
    <p className="flex items-center gap-1.5 text-sm text-primary-foreground/70">
      <BadgeCheck className="size-4 shrink-0" aria-hidden />
      {t("trustMessage")}
    </p>
  )
}
