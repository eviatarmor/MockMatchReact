import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { SimulationIdePageContent } from "@/features/simulation-ide/simulation-ide-page"

export function SimulationIdePage() {
  const { t } = useTranslation("simulation-ide")
  useDocumentTitle(t("documentTitle"))

  return <SimulationIdePageContent />
}
