import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { SimulationQuestionPageContent } from "@/features/simulations/simulation-question-page"

export function SimulationQuestionPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("simulations.documentTitle"))

  return <SimulationQuestionPageContent />
}
