import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { SimulationsPageContent } from "@/features/simulations/simulations-page"

export function SimulationsPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("simulations.documentTitle"))

  return <SimulationsPageContent />
}