import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { VerticalTabs, type VerticalTabItem } from "@/components/shadcn-space/vertical-tabs/vertical-tabs"
import { useAccountSettingsForm } from "@/features/account-settings/hooks/use-account-settings-form"
import { NAV_ITEMS } from "@/features/account-settings/constants"
import { ProfileSection } from "@/features/account-settings/right-pane/profile-section"
import { AppearanceSection } from "@/features/account-settings/right-pane/appearance-section"
import { VoiceSection } from "@/features/account-settings/right-pane/voice-section"
import { RegionSection } from "@/features/account-settings/right-pane/region-section"
import { AccountAccessSection } from "@/features/account-settings/right-pane/account-access-section"

export function AccountSettingsPageContent() {
  const { t } = useTranslation("account-settings")
  const { form, email } = useAccountSettingsForm()

  const tabs = useMemo<VerticalTabItem[]>(() => {
    const content: Record<string, React.ReactNode> = {
      profile: <ProfileSection form={form} email={email} />,
      appearance: <AppearanceSection />,
      voice: <VoiceSection form={form} />,
      region: <RegionSection form={form} />,
      account: <AccountAccessSection />,
    }
    return NAV_ITEMS.map(({ id, labelKey, icon }) => ({
      id,
      label: t(labelKey),
      icon,
      content: content[id],
    }))
  }, [form, email, t])

  return (
    <DashboardPageShell title={t("title")} searchPlaceholder={t("title")}>
      <div className="flex flex-col gap-6">
        <DashboardPageHeader title={t("title")} description={t("description")} />
        <VerticalTabs tabs={tabs} defaultTabId="profile" layoutId="account-settings-tab" />
      </div>
    </DashboardPageShell>
  )
}
