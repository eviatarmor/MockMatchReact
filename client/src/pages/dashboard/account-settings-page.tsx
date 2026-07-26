import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { AccountSettingsPageContent } from "@/features/account-settings/account-settings-page"

export function AccountSettingsPage() {
  const { t } = useTranslation("account-settings")
  useDocumentTitle(t("documentTitle"))

  return <AccountSettingsPageContent />
}