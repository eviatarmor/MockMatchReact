import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { ScrollSpyTabs, type ScrollSpyTabItem } from "@/components/shadcn-space/scroll-spy-tabs/scroll-spy-tabs"
import { usePrivacyForm } from "@/features/privacy/hooks/use-privacy-form"
import { PRIVACY_NAV_ITEMS } from "@/features/privacy/constants"
import { PrivacySettingsSection } from "@/features/privacy/sections/privacy-settings-section"
import { CookiesSection } from "@/features/privacy/sections/cookies-section"
import { DataSection } from "@/features/privacy/sections/data-section"

export function PrivacyPageContent() {
  const { t } = useTranslation("privacy")
  const { form } = usePrivacyForm()

  const tabs = useMemo<ScrollSpyTabItem[]>(() => {
    const content: Record<string, React.ReactNode> = {
      privacy: <PrivacySettingsSection form={form} />,
      cookies: <CookiesSection form={form} />,
      data: <DataSection />,
    }
    return PRIVACY_NAV_ITEMS.map(({ id, labelKey, icon }) => ({
      id,
      label: t(labelKey),
      icon,
      content: content[id],
    }))
  }, [form, t])

  return (
    <DashboardPageShell title={t("title")}>
      <div className="flex flex-col gap-6">
        <DashboardPageHeader title={t("title")} description={t("description")} />
        <ScrollSpyTabs tabs={tabs} defaultTabId="privacy" />
      </div>
    </DashboardPageShell>
  )
}
