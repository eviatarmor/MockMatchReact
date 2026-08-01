import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { SimulationConversationPageContent } from "@/features/simulation-conversation/simulation-conversation-page"

export function SimulationConversationPage() {
  const { t } = useTranslation("simulation-conversation")
  useDocumentTitle(t("documentTitle"))

  return <SimulationConversationPageContent />
}
