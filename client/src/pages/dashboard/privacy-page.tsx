import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PrivacyPageContent } from "@/features/privacy/privacy-page";

export function PrivacyPage() {
  const { t } = useTranslation("privacy");

  useEffect(() => {
    document.title = t("documentTitle");
  }, [t]);

  return <PrivacyPageContent />;
}
