import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PaymentCardVisual } from "@/components/shadcn-space/credit-card/credit-card"
import { SectionShell } from "@/components/layout/section-shell"
import {
  formatCardExpiry,
  mapCardBrand,
  type BillingSummary,
} from "@/features/billing/types"
import {
  useBillingActions,
  useBillingSummary,
} from "@/features/billing/hooks/use-billing"

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

function PaymentBody({ summary }: { readonly summary: BillingSummary }) {
  const { t } = useTranslation("billing")
  const { openPortal, isPortalPending, startTopUp, isTopUpPending } = useBillingActions()
  const { card, credits, details } = summary
  const remaining = Math.max(0, credits.total - credits.used)
  const hasCard = Boolean(card.last4)
  const brand = mapCardBrand(card.brand)
  const visualBrand = brand === "mastercard" ? "mastercard" : "visa"

  return (
    <>
      {hasCard ? (
        <>
          <PaymentCardVisual
            issuer="MockMatch"
            holder={card.holder || details.name || details.email}
            last4={card.last4 ?? "••••"}
            expiry={formatCardExpiry(card.expMonth, card.expYear)}
            brand={visualBrand}
            balanceLabel={t("payment.creditsLabel")}
            balanceValue={t("payment.creditsValue", { count: remaining })}
          />
          <p className="text-center text-xs text-muted-foreground">{t("payment.flipHint")}</p>
          <p className="text-center text-xs text-muted-foreground">{t("payment.pciNote")}</p>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <span className="text-sm font-medium text-foreground">{t("payment.emptyTitle")}</span>
            <span className="text-xs text-muted-foreground">{t("payment.emptyDescription")}</span>
            <p className="text-xs text-muted-foreground">{t("payment.pciNote")}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("payment.detailsHeading")}
          </span>
          <DetailRow label={t("payment.name")} value={details.name || "—"} />
          <Separator />
          <DetailRow label={t("payment.email")} value={details.email} />
          {(details.addressLine || details.city || details.country) && (
            <>
              <Separator />
              <DetailRow
                label={t("payment.address")}
                value={
                  <span className="flex flex-col">
                    {details.addressLine && <span>{details.addressLine}</span>}
                    {details.city && <span>{details.city}</span>}
                  </span>
                }
              />
              {details.country && (
                <>
                  <Separator />
                  <DetailRow label={t("payment.country")} value={details.country} />
                </>
              )}
            </>
          )}

          <div className="mt-1 flex flex-wrap gap-2">
            {summary.stripeConfigured && (
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={isPortalPending}
                onClick={() => openPortal()}
              >
                {hasCard ? t("payment.update") : t("payment.addViaStripe")}
              </Button>
            )}
            {summary.stripeConfigured && !hasCard && (
              <Button
                className="cursor-pointer"
                disabled={isTopUpPending}
                onClick={() => startTopUp("credits_100")}
              >
                {t("payment.buyToAddCard")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export function PaymentSection() {
  const { t } = useTranslation("billing")
  const summaryQuery = useBillingSummary()

  return (
    <SectionShell heading={t("payment.heading")} description={t("payment.description")}>
      {summaryQuery.isLoading ? (
        <Card>
          <CardContent className="h-40 animate-pulse rounded-lg bg-muted/40" />
        </Card>
      ) : summaryQuery.data ? (
        <PaymentBody summary={summaryQuery.data} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("usage.loadError")}</p>
      )}
    </SectionShell>
  )
}
