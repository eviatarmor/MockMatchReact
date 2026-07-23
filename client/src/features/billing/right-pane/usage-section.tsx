import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { SectionShell } from "@/components/layout/section-shell"
import { BREAKDOWN_LABEL_KEYS } from "@/features/billing/constants"
import {
  formatMoney,
  type BillingSummary,
  type CreditPack,
} from "@/features/billing/types"
import {
  useBillingActions,
  useBillingPacks,
  useBillingSummary,
} from "@/features/billing/hooks/use-billing"

function UsageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="h-24 animate-pulse rounded-lg bg-muted/40" />
      </Card>
      <Card>
        <CardContent className="h-40 animate-pulse rounded-lg bg-muted/40" />
      </Card>
    </div>
  )
}

interface PackListProps {
  readonly packs: readonly CreditPack[]
  readonly stripeConfigured: boolean
  readonly pending: boolean
  readonly onTopUp: (packId: CreditPack["id"]) => void
}

function PackList({ packs, stripeConfigured, pending, onTopUp }: PackListProps) {
  const { t } = useTranslation("billing")

  if (!stripeConfigured) {
    return (
      <p className="text-sm text-muted-foreground">{t("usage.stripeNotConfigured")}</p>
    )
  }

  const available = packs.filter((pack) => pack.available)
  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("usage.packsUnavailable")}</p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {t("usage.packsHeading")}
      </span>
      {available.map((pack) => (
        <div key={pack.id} className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {t("usage.packCredits", { count: pack.credits })}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatMoney(pack.amountCents, pack.currency)}
            </span>
          </div>
          <Button
            size="sm"
            className="cursor-pointer"
            disabled={pending}
            onClick={() => onTopUp(pack.id)}
          >
            {t("usage.buyPack")}
          </Button>
        </div>
      ))}
    </div>
  )
}

function UsageBody({
  summary,
  packs,
}: {
  readonly summary: BillingSummary
  readonly packs: readonly CreditPack[]
}) {
  const { t } = useTranslation("billing")
  const { startTopUp, isTopUpPending } = useBillingActions()
  const { credits } = summary
  const remaining = Math.max(0, credits.total - credits.used)
  const percent =
    credits.total > 0 ? Math.min(100, Math.round((credits.used / credits.total) * 100)) : 0

  const breakdownRows = [
    { id: "mockInterviews" as const, used: credits.breakdown.mockInterviews },
    { id: "resumeScans" as const, used: credits.breakdown.resumeScans },
    { id: "coverLetters" as const, used: credits.breakdown.coverLetters },
    { id: "jobFits" as const, used: credits.breakdown.jobFits ?? 0 },
  ]

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("usage.currentPlan")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                {t("usage.plans.free")}
              </span>
              <Badge variant="secondary">{t("usage.price.free")}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{t("usage.freeHint")}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("usage.credits.heading")}
              </span>
              <span className="text-2xl font-semibold text-foreground tabular-nums">
                {t("usage.credits.remaining", { count: remaining })}
              </span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("usage.credits.usedOfTotal", {
                used: credits.used,
                total: credits.total,
              })}
            </span>
          </div>

          <Progress value={percent} />

          <Separator />

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("usage.credits.breakdownHeading")}
            </span>
            {breakdownRows.map((item, index) => (
              <Fragment key={item.id}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground">
                    {t(BREAKDOWN_LABEL_KEYS[item.id])}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">{item.used}</span>
                </div>
              </Fragment>
            ))}
          </div>

          <Separator />

          <PackList
            packs={packs}
            stripeConfigured={summary.stripeConfigured}
            pending={isTopUpPending}
            onTopUp={startTopUp}
          />
        </CardContent>
      </Card>
    </>
  )
}

export function UsageSection() {
  const { t } = useTranslation("billing")
  const summaryQuery = useBillingSummary()
  const packsQuery = useBillingPacks()

  return (
    <SectionShell heading={t("usage.heading")} description={t("usage.description")}>
      {summaryQuery.isLoading || packsQuery.isLoading ? (
        <UsageSkeleton />
      ) : summaryQuery.data ? (
        <UsageBody summary={summaryQuery.data} packs={packsQuery.data ?? []} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("usage.loadError")}</p>
      )}
    </SectionShell>
  )
}
