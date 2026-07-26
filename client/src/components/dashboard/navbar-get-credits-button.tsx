import { useState } from "react"
import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { TopUpCreditsDialog } from "@/features/billing/components/top-up-credits-dialog"
import { useBillingSummary } from "@/features/billing/hooks/use-billing"

/** Rainbow CTA → top-up dialog. Only when remaining credits = 0. */
export function NavbarGetCreditsButton() {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)
  const summaryQuery = useBillingSummary()

  if (summaryQuery.isLoading || !summaryQuery.data) return null

  const { credits } = summaryQuery.data
  const remaining = Math.max(0, credits.total - credits.used)
  if (remaining > 0) return null

  return (
    <>
      <RainbowButton
        size="sm"
        className="cursor-pointer rounded-lg"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-3.5" />
        <span className="hidden sm:inline">{t("navbar.getCredits")}</span>
        <span className="sm:hidden">{t("navbar.getCreditsShort")}</span>
      </RainbowButton>
      <TopUpCreditsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
