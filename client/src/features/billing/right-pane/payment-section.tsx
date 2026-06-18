import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PaymentCardVisual } from "@/components/shadcn-space/credit-card/credit-card"
import { SectionShell } from "@/features/billing/right-pane/section-shell"
import { MOCK_BILLING } from "@/features/billing/constants"

interface DetailRowProps {
  readonly label: string
  readonly value: ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

export function PaymentSection() {
  const { t } = useTranslation("billing")
  const { card, credits, details } = MOCK_BILLING
  const remaining = credits.total - credits.used

  return (
    <SectionShell heading={t("payment.heading")} description={t("payment.description")}>
      <PaymentCardVisual
        issuer="MockMatch"
        holder={card.holder}
        last4={card.last4}
        expiry={card.expiry}
        brand={card.brand}
        balanceLabel={t("payment.creditsLabel")}
        balanceValue={t("payment.creditsValue", { count: remaining })}
      />
      <p className="text-center text-xs text-muted-foreground">{t("payment.flipHint")}</p>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("payment.detailsHeading")}
          </span>
          <DetailRow label={t("payment.name")} value={details.name} />
          <Separator />
          <DetailRow label={t("payment.email")} value={details.email} />
          <Separator />
          <DetailRow
            label={t("payment.address")}
            value={
              <span className="flex flex-col">
                <span>{details.addressLine}</span>
                <span>{details.city}</span>
              </span>
            }
          />
          <Separator />
          <DetailRow label={t("payment.country")} value={details.country} />

          <Button
            variant="outline"
            className="mt-1 cursor-pointer self-start"
            onClick={() => toast.info(t("toast.paymentUpdated"))}
          >
            {t("payment.update")}
          </Button>
        </CardContent>
      </Card>
    </SectionShell>
  )
}
