import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { ScrollSpyTabs, type ScrollSpyTabItem } from "@/components/shadcn-space/scroll-spy-tabs/scroll-spy-tabs"
import { NAV_ITEMS } from "@/features/billing/constants"
import { UsageSection } from "@/features/billing/right-pane/usage-section"
import { PaymentSection } from "@/features/billing/right-pane/payment-section"
import { BillingHistorySection } from "@/features/billing/right-pane/billing-history-section"

export function BillingPageContent() {
  const { t } = useTranslation("billing")

  const tabs = useMemo<ScrollSpyTabItem[]>(() => {
    const content: Record<string, React.ReactNode> = {
      usage: <UsageSection />,
      payment: <PaymentSection />,
      history: <BillingHistorySection />,
    }
    return NAV_ITEMS.map(({ id, labelKey, icon }) => ({
      id,
      label: t(labelKey),
      icon,
      content: content[id],
    }))
  }, [t])

  return (
    <DashboardPageShell title={t("title")}>
      <div className="flex flex-col gap-6">
        <DashboardPageHeader title={t("title")} description={t("description")} />
        <ScrollSpyTabs tabs={tabs} defaultTabId="usage" />
      </div>
    </DashboardPageShell>
  )
}
