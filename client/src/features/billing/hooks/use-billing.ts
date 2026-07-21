import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type { CreditPackId } from "@mockmatch/schemas"
import { trpc } from "@/lib/trpc"

export function useBillingSummary() {
  return trpc.billing.summary.useQuery()
}

export function useBillingPacks() {
  return trpc.billing.listPacks.useQuery()
}

export function useBillingInvoices() {
  return trpc.billing.listInvoices.useQuery()
}

export function useBillingActions() {
  const { t } = useTranslation("billing")

  const topUp = trpc.billing.createTopUpCheckout.useMutation({
    onSuccess: (data) => {
      window.location.assign(data.url)
    },
    onError: (error) => {
      toast.error(t("toast.checkoutError"), {
        description: error.message,
      })
    },
  })

  const portal = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.assign(data.url)
    },
    onError: (error) => {
      toast.error(t("toast.portalError"), {
        description: error.message,
      })
    },
  })

  return {
    startTopUp: (packId: CreditPackId) => topUp.mutate({ packId }),
    openPortal: () => portal.mutate(),
    isTopUpPending: topUp.isPending,
    isPortalPending: portal.isPending,
  }
}
