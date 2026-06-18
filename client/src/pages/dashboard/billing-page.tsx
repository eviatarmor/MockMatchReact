import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BillingPageContent } from "@/features/billing/billing-page";

export function BillingPage() {
  const { t } = useTranslation("billing");

  useEffect(() => {
    document.title = t("documentTitle");
  }, [t]);

  return <BillingPageContent />;
}
