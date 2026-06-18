import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { SectionShell } from "@/features/billing/right-pane/section-shell"
import { MOCK_BILLING } from "@/features/billing/constants"

export function UsageSection() {
  const { t } = useTranslation("billing")
  const { plan, credits } = MOCK_BILLING
  const remaining = credits.total - credits.used
  const percent = Math.round((credits.used / credits.total) * 100)

  return (
    <SectionShell heading={t("usage.heading")} description={t("usage.description")}>
      {/* Current plan */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("usage.currentPlan")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">{t(plan.nameKey)}</span>
              <Badge>{t(plan.priceKey)}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {t("usage.renewsOn", { date: plan.renewalDate })}
            </span>
          </div>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => toast.info(t("toast.planManaged"))}
          >
            {t("usage.managePlan")}
          </Button>
        </CardContent>
      </Card>

      {/* Credits */}
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
              {t("usage.credits.usedOfTotal", { used: credits.used, total: credits.total })}
            </span>
          </div>

          <Progress value={percent} />

          <Separator />

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("usage.credits.breakdownHeading")}
            </span>
            {credits.breakdown.map((item, index) => (
              <Fragment key={item.id}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground">{t(item.labelKey)}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">{item.used}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  )
}
