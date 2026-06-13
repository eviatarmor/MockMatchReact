import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function ResetPasswordSuccess() {
  const { t } = useTranslation("reset-password")

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
        <Check className="size-6" />
      </span>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold">{t("successTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("successDescription")}</p>
      </div>

      <Button render={<Link to="/login" />} size="lg" className="w-full">
        {t("continueToSignInLabel")}
      </Button>
    </div>
  )
}
