import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { SimulationMcqPageContent } from "@/features/simulation-mcq/simulation-mcq-page"

export function SimulationMcqPage() {
  const { t } = useTranslation("simulation-mcq")
  useDocumentTitle(t("documentTitle"))

  return <SimulationMcqPageContent />
}
