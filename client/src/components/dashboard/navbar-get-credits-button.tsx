import { useState } from "react"
import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RainbowButton } from "@mockmatch/ui/rainbow-button"
import { NumberTicker } from "@/components/shadcn-space/number-ticker/number-ticker-01"
import { TopUpCreditsDialog } from "@/features/billing/components/top-up-credits-dialog"
import { useBillingSummary } from "@/features/billing/hooks/use-billing"

/**
 * Rainbow top-up control in the dashboard navbar.
 * remaining > 0 → sparkles + NumberTicker balance; remaining === 0 → Get credits CTA.
 * Both open the top-up dialog.
 */
export function NavbarGetCreditsButton() {
  const { t } = useTranslation("common")
  const [open, setOpen] = useState(false)
  const summaryQuery = useBillingSummary()

  if (summaryQuery.isLoading || !summaryQuery.data) return null

  const { credits } = summaryQuery.data
  const remaining = Math.max(0, credits.total - credits.used)

  return (
    <>
      <RainbowButton
        type="button"
        size="sm"
        className="cursor-pointer rounded-lg tabular-nums"
        aria-label={
          remaining > 0
            ? t("navbar.creditsBalanceAria", { count: remaining })
            : undefined
        }
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-3.5" />
        {remaining > 0 ? (
          <>
            <NumberTicker end={remaining} duration={0.6} formatNumber />
            <span className="hidden sm:inline">{t("navbar.creditsLabel")}</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">{t("navbar.getCredits")}</span>
            <span className="sm:hidden">{t("navbar.getCreditsShort")}</span>
          </>
        )}
      </RainbowButton>
      <TopUpCreditsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
