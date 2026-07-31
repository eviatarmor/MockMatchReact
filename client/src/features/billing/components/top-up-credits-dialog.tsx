import { Loader2 } from "lucide-react"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@mockmatch/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
import { Separator } from "@mockmatch/ui/separator"
import { ShineBorder } from "@mockmatch/ui/shine-border"
import {
  useBillingActions,
  useBillingPacks,
  useBillingSummary,
} from "@/features/billing/hooks/use-billing"
import { formatMoney } from "@/features/billing/types"
import { trpc } from "@/lib/trpc"

interface TopUpCreditsDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Shine-border pack card — Stripe top-up, billing link, optional dev grant. */
export function TopUpCreditsDialog({
  open,
  onOpenChange,
}: TopUpCreditsDialogProps) {
  const { t } = useTranslation("common")
  const { t: tb } = useTranslation("billing")
  const utils = trpc.useUtils()
  const summaryQuery = useBillingSummary()
  const packsQuery = useBillingPacks()
  const { startTopUp, isTopUpPending } = useBillingActions()

  const grantDev = trpc.collab.grantDevCredits.useMutation({
    onSuccess: async () => {
      toast.success(t("navbar.creditsCard.devGranted"))
      await Promise.all([
        utils.billing.summary.invalidate(),
        utils.collab.getAccess.invalidate(),
      ])
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(t("navbar.creditsCard.devError"), {
        description: error.message,
      })
    },
  })

  const stripeConfigured = summaryQuery.data?.stripeConfigured ?? false
  const packs = (packsQuery.data ?? []).filter((pack) => pack.available)
  const isDev = import.meta.env.DEV

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative gap-0 overflow-hidden sm:max-w-[360px]">
        <ShineBorder
          borderWidth={1.5}
          duration={12}
          shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
        />

        <DialogHeader className="pr-6">
          <DialogTitle>{t("navbar.creditsCard.title")}</DialogTitle>
          <DialogDescription>{t("navbar.creditsCard.description")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-3">
          {packsQuery.isLoading || summaryQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-sm text-muted-foreground">
              <RobotLoader size="sm" label={t("navbar.creditsCard.loading")} />
              <p>{t("navbar.creditsCard.loading")}</p>
            </div>
          ) : !stripeConfigured ? (
            <p className="text-sm text-muted-foreground">{tb("usage.stripeNotConfigured")}</p>
          ) : packs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tb("usage.packsUnavailable")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {tb("usage.packsHeading")}
              </span>
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {tb("usage.packCredits", { count: pack.credits })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMoney(pack.amountCents, pack.currency)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="cursor-pointer shrink-0"
                    disabled={isTopUpPending}
                    onClick={() => startTopUp(pack.id)}
                  >
                    {tb("usage.buyPack")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {isDev && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("navbar.creditsCard.devHeading")}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full cursor-pointer"
                  disabled={grantDev.isPending}
                  onClick={() => grantDev.mutate({ amount: 100 })}
                >
                  {grantDev.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    t("navbar.creditsCard.grantDev")
                  )}
                </Button>
              </div>
            </>
          )}

          <Separator />

          <Button
            variant="outline"
            className="w-full cursor-pointer"
            render={<Link to="/billing" onClick={() => onOpenChange(false)} />}
          >
            {t("navbar.creditsCard.viewBilling")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
