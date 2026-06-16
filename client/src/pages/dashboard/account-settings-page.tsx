import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AccountSettingsPageContent } from "@/features/account-settings/account-settings-page";

export function AccountSettingsPage() {
  const { t } = useTranslation("account-settings");

  useEffect(() => {
    document.title = t("documentTitle");
  }, [t]);

  return <AccountSettingsPageContent />;
}
