import { useTranslation } from "react-i18next"
import { SimulationWhiteboardPageContent } from "@/features/simulation-whiteboard/simulation-whiteboard-page"

export function SimulationWhiteboardPage() {
  const { t } = useTranslation("simulation-whiteboard")
  document.title = `${t("title")} · MockMatch`
  return <SimulationWhiteboardPageContent />
}
